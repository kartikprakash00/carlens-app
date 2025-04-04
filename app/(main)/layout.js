import Footer from '@/components/footer'
import React from 'react'

const MainLayout = ({ children }) => {
    return (
        <div className='container mx-auto mt-22'>
            {children}
            <footer className="w-full">
                <div className="container text-center text-gray-600">
                    <Footer />
                </div>
            </footer>
        </div>
    )
}

export default MainLayout
