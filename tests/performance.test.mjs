import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';

// Isolated loadedModule graphs let us exercise server reads without live accounts or writes.
async function load(relative, overrides = {}) {
    const context = vm.createContext({ console, performance, Set, Number, Date, URL, process: { env: {} } });
    const modules = new Map();
    const defaults = {
        'server-only': {},
        react: { cache: fn => fn },
        'next/cache': { unstable_cache: fn => fn, revalidatePath() {}, updateTag() {} },
        '@clerk/nextjs/server': { auth: async () => ({ userId: null }), currentUser: async () => null },
        '@/lib/checkUser': { checkUser: async () => null },
    };
    const mocks = { ...defaults, ...overrides };
    async function get(specifier, parent = path.resolve('index.js')) {
        const id = Object.hasOwn(mocks, specifier) ? specifier : path.resolve(specifier.startsWith('@/') ? specifier.slice(2) : path.dirname(parent), specifier.startsWith('@/') ? '' : specifier);
        const resolved = Object.hasOwn(mocks, specifier) ? id : (path.extname(id) ? id : `${id}.js`);
        if (modules.has(resolved)) return modules.get(resolved);
        let loadedModule;
        if (Object.hasOwn(mocks, specifier)) {
            const exports = mocks[specifier];
            loadedModule = new vm.SyntheticModule(Object.keys(exports), function () {
                for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
            }, { context, identifier: resolved });
        } else {
            loadedModule = new vm.SourceTextModule(await readFile(resolved, 'utf8'), { context, identifier: resolved });
        }
        modules.set(resolved, loadedModule);
        await loadedModule.link((child) => get(child, resolved));
        return loadedModule;
    }
    const loadedModule = await get(path.resolve(relative));
    await loadedModule.evaluate();
    return loadedModule.namespace;
}
const plain = value => JSON.parse(JSON.stringify(value));

test('query normalization rejects malformed pagination and bounds prices', async () => {
    const { normalizeCarQuery } = await load('lib/car-query.js');
    for (const page of ['-1', '0', 'abc', '1.5', 'Infinity', ['2']]) assert.equal(normalizeCarQuery({ page }).page, 1);
    const result = normalizeCarQuery({ page: '3', minPrice: '20', maxPrice: '5', sortBy: 'bad', make: ['Ford'], limit: '999' });
    assert.equal(result.page, 3);
    assert.equal(result.maxPrice, 20);
    assert.equal(result.sortBy, 'newest');
    assert.equal(result.make, '');
    assert.equal(result.limit, 100);
    assert.equal(normalizeCarQuery({ minPrice: 'NaN' }).minPrice, 0);
});

test('all five filter reads start before any finishes; empty price range is usable', async () => {
    const pending = [];
    const query = () => new Promise(resolve => pending.push(resolve));
    const { getCarFilters } = await load('actions/car-listing.js', { '@/lib/prisma': { db: { car: { findMany: query, aggregate: query } } } });
    const resultPromise = getCarFilters();
    assert.equal(pending.length, 5);
    pending.slice(0, 4).forEach(resolve => resolve([]));
    pending[4]({ _min: { price: null }, _max: { price: null } });
    assert.deepEqual(plain((await resultPromise).data.priceRange), { min: 0, max: 100000 });
});

test('listing counts and rows run concurrently; wishlist is restricted to displayed IDs', async () => {
    let countResolve, rowsResolve, savedWhere;
    const db = {
        car: {
            count: () => new Promise(resolve => { countResolve = resolve; }),
            findMany: args => { assert.equal(args.skip, 12); return new Promise(resolve => { rowsResolve = resolve; }); },
        },
        userSavedCar: { findMany: async ({ where }) => { savedWhere = where; return [{ carId: 'car-a' }]; } },
    };
    const { getCars } = await load('actions/car-listing.js', { '@/lib/prisma': { db }, '@/lib/checkUser': { checkUser: async () => ({ id: 'user-a' }) } });
    const promise = getCars({ page: '3' });
    assert.equal(typeof countResolve, 'function');
    assert.equal(typeof rowsResolve, 'function');
    countResolve(13); rowsResolve([{ id: 'car-a', price: '12.50' }]);
    const result = await promise;
    assert.deepEqual(plain(savedWhere), { userId: 'user-a', carId: { in: ['car-a'] } });
    assert.equal(result.data[0].wishlisted, true);
    assert.equal(result.pagination.pages, 3);
});

test('existing users avoid Clerk profile requests; creation races recover the same user', async () => {
    for (const race of [false, true]) {
        let profiles = 0, reads = 0;
        const existing = { id: 'user-a', role: 'USER' };
        const { checkUser } = await load('lib/checkUser.js', {
            './prisma': { db: { user: {
                findUnique: async () => (++reads === 1 && race ? null : existing),
                upsert: async () => { throw Object.assign(new Error('unique'), { code: 'P2002' }); },
            } } },
            '@clerk/nextjs/server': { auth: async () => ({ userId: 'clerk-a' }), currentUser: async () => { profiles++; return { emailAddresses: [{ emailAddress: 'test@example.com' }] }; } },
        });
        assert.equal((await checkUser()).id, existing.id);
        assert.equal(profiles, race ? 1 : 0);
    }
});

test('anonymous identity lookup never reads the database or Clerk profile', async () => {
    const { checkUser } = await load('lib/checkUser.js', { './prisma': { db: {} } });
    assert.equal(await checkUser(), null);
});

test('dashboard aggregates preserve counts and distinct sold-car conversion', async () => {
    for (const empty of [false, true]) {
        const db = {
            car: {
                groupBy: async () => empty ? [] : [{ status: 'AVAILABLE', _count: { _all: 2 } }, { status: 'SOLD', _count: { _all: 1 } }],
                count: async () => empty ? 0 : 1,
            },
            testDriveBooking: { groupBy: async () => empty ? [] : [{ status: 'COMPLETED', _count: { _all: 2 } }, { status: 'PENDING', _count: { _all: 1 } }] },
        };
        const { getDashboardData } = await load('actions/admin.js', {
            '@/lib/prisma': { db }, '@/lib/checkUser': { checkUser: async () => ({ role: 'ADMIN' }) },
            '@clerk/nextjs/server': { auth: async () => ({ userId: 'admin' }) },
        });
        const result = await getDashboardData();
        assert.equal(result.data.cars.total, empty ? 0 : 3);
        assert.equal(result.data.testDrives.conversionRate, empty ? 0 : 50);
    }
});

test('dashboard authorization prevents aggregate reads for regular users', async () => {
    const { getDashboardData } = await load('actions/admin.js', {
        '@/lib/prisma': { db: {} }, '@/lib/checkUser': { checkUser: async () => ({ role: 'USER' }) },
        '@clerk/nextjs/server': { auth: async () => ({ userId: 'user' }) },
    });
    assert.equal((await getDashboardData()).authorized, false);
});

test('inventory mutations expire filter metadata immediately and refresh dependent routes', async () => {
    const tags = [], paths = [];
    const { invalidateInventory } = await load('lib/invalidate-inventory.js', { 'next/cache': { updateTag: tag => tags.push(tag), revalidatePath: (...args) => paths.push(args) } });
    invalidateInventory();
    assert.deepEqual(tags, ['car-filters']);
    assert.ok(paths.some(([route]) => route === '/saved-cars'));
    assert.ok(paths.some(([route, type]) => route === '/cars/[id]' && type === 'page'));
});

test('AI calls have a 30-second deadline and redact upstream error details', async () => {
    const { generateCarContent } = await load('lib/generate-car-content.js');
    await assert.rejects(generateCarContent({ generateContent: async (_, options) => {
        assert.equal(options.timeout, 30000);
        throw new Error('secret upstream URL');
    } }, []), /temporarily unavailable/);
});


test('legacy car image URLs use the configured storage project without rewriting unrelated URLs', async () => {
    const { resolveCarImageUrl } = await load('lib/car-image.js');
    const path = '/storage/v1/object/public/cars-images/cars/example/image.webp';
    assert.equal(resolveCarImageUrl('https://opxstaeqvzakqaqdjvfq.supabase.co' + path, 'https://current.supabase.co'), 'https://current.supabase.co' + path);
    for (const value of ['https://other.example/image.webp', '/logo.png', 'invalid', 'https://opxstaeqvzakqaqdjvfq.supabase.co/other-bucket/image.webp']) {
        assert.equal(resolveCarImageUrl(value, 'https://current.supabase.co'), value);
    }
    assert.equal(resolveCarImageUrl('https://opxstaeqvzakqaqdjvfq.supabase.co' + path, ''), 'https://opxstaeqvzakqaqdjvfq.supabase.co' + path);
});
