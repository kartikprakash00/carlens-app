const major = Number(process.versions.node.split('.')[0]);

if (major !== 22) {
    console.error(
        `This project requires Node 22.x; you are running ${process.version}.\n` +
        'Run `nvm use` (or `nvm install` first), then run `npm run dev` again.'
    );
    process.exit(1);
}
