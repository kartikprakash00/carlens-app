import React from 'react'
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import CarCard from '@/components/car-card';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const CarListing = ({ result, query }) => {
    const { page, limit } = result.pagination;
    const searchParams = new URLSearchParams(query);
    const getPaginationUrl = (pageNum) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", pageNum.toString());
        return `?${params.toString()}`;
    }

    const { data: cars, pagination } = result;

    if (cars.length === 0) {
        return (
            <div className='min-h-[400px] flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-gray-50'>
                <div className='bg-gray-100 p-4 rounded-full mb-4'>
                    <Info className='h-8 w-8 text-gray-500' />
                </div>
                <h3 className='text-lg font-medium mb-2'>No cars found</h3>
                <p className='text-gray-500 mb-6 max-w-md'>
                    Sorry, we couldn&apos;t find any cars matching your search criteria. Try adjusting your filters or search term.
                </p>
                <Button variant='outline' asChild>
                    <Link href='/cars'>Clear all filters</Link>
                </Button>
            </div>
        );
    }

    const paginationItems = [];

    const visiblePageNumbers = [];

    visiblePageNumbers.push(1);

    for (let i = Math.max(2, page - 1); i <= Math.min(pagination.pages - 1, page + 1); i++) {
        visiblePageNumbers.push(i);
    }

    if (pagination.pages > 1) {
        visiblePageNumbers.push(pagination.pages);
    }

    const uniquePageNumbers = [...new Set(visiblePageNumbers)].sort((a, b) => a - b);

    let lastPageNumber = 0;

    uniquePageNumbers.forEach((pageNumber) => {
        if (pageNumber - lastPageNumber > 1) {
            paginationItems.push(
                <PaginationItem key={`ellipsis-${pageNumber}`}>
                    <PaginationEllipsis />
                </PaginationItem>
            );
        }

        paginationItems.push(
            <PaginationItem key={pageNumber}>
                <PaginationLink href={getPaginationUrl(pageNumber)}
                    isActive={pageNumber === page}
                >
                    {pageNumber}
                </PaginationLink>
            </PaginationItem>
        );
        lastPageNumber = pageNumber;
    });

    return (
        <div>
            <div className='flex justify-between items-center mb-6'>
                <p className='text-gray-600'>
                    Showing{" "}
                    <span className='font-medium'>
                        {(page - 1) * limit + 1}-{Math.min(page * limit, pagination.total)}
                    </span>{" "}
                    of <span className='font-medium'>{pagination.total}</span> cars
                </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {cars.map(car => <CarCard key={car.id} car={car} />)}
            </div>

            {pagination.pages > 1 && (
                <Pagination className='mt-10'>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious href={getPaginationUrl(Math.max(1, page - 1))}
                                className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                            />
                        </PaginationItem>
                        {paginationItems}

                        <PaginationItem>
                            <PaginationNext href={getPaginationUrl(Math.min(pagination.pages, page + 1))}
                                className={page >= pagination.pages ? 'pointer-events-none opacity-50' : ''}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    )
}

export default CarListing
