import React from 'react'

const Footer = () => {
    return (
        <footer className="bg-white text-gray-800 py-5 px-2 border-t">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-32">
                {/* Logo & Description */}
                <div>
                    <div className="flex md:flex-col justify-center items-center">
                        <img src="/logo.png" className="w-24 md:w-28 h-auto" alt="CarLens Logo" />
                        <h2 className="text-2xl font-bold gradient-title">CarLens</h2>
                    </div>
                    <p className="mt-4 text-gray-600 max-w-full mx-2">
                        CarLens is the ultimate marketplace for car buyers and enthusiasts.
                        Browse a wide selection of vehicles, compare features, and seamlessly
                        book a test drive through our platform. Find your dream car with
                        ease and drive with confidence!
                    </p>
                </div>

                {/* Navigation Links */}
                <div className='mt-4'>
                    <h3 className="text-lg font-semibold">Company</h3>
                    <ul className="mt-3 space-y-2 text-gray-600">
                        <li><a href="/" className="hover:text-gray-900">Home</a></li>
                        <li><a href="/cars" className="hover:text-gray-900">Explore</a></li>
                        <li><a href="/reservations" className="hover:text-gray-900">Reservations</a></li>
                        <li><a href="mailto:support@carlens.com" className="hover:text-gray-900">Contact Us</a></li>
                    </ul>
                </div>

                {/* Contact Info */}
                <div className='mt-4'>
                    <h3 className="text-lg font-semibold">Get in Touch</h3>
                    <ul className="mt-3 text-gray-600">
                        <li>📞 1800-555-1234</li>
                        <li>📧 support@carlens.com</li>
                    </ul>
                </div>
            </div>

            {/* Divider */}
            <hr className="mt-8 border-gray-300" />

            {/* Copyright */}
            <div className="border-t">
                <p className="mt-5 text-sm text-center text-gray-500">
                    &copy; {new Date().getFullYear()} CarLens - All Rights Reserved.
                </p>
            </div>
        </footer>

    )
}

export default Footer
