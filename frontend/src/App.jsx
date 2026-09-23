import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/AdminLayout';

// Passenger Pages
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import BooksPage from './pages/BooksPage';
import BookDetailsPage from './pages/BookDetailsPage';
import LibrariesPage from './pages/LibrariesPage';
import RentalPage from './pages/RentalPage';
import DashboardPage from './pages/DashboardPage';
import RentalDetailsPage from './pages/RentalDetailsPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminBooksPage from './pages/admin/AdminBooksPage';
import AdminLibrariesPage from './pages/admin/AdminLibrariesPage';
import AdminStockPage from './pages/admin/AdminStockPage';
import AdminConnectionsPage from './pages/admin/AdminConnectionsPage';
import AdminRentalsPage from './pages/admin/AdminRentalsPage';
import AdminReturnsPage from './pages/admin/AdminReturnsPage';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Protected Admin Routes (Dedicated Admin Layout) */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/books" element={<AdminBooksPage />} />
              <Route path="/admin/libraries" element={<AdminLibrariesPage />} />
              <Route path="/admin/stock" element={<AdminStockPage />} />
              <Route path="/admin/connections" element={<AdminConnectionsPage />} />
              <Route path="/admin/rentals" element={<AdminRentalsPage />} />
              <Route path="/admin/returns" element={<AdminReturnsPage />} />
            </Route>
          </Route>

          {/* Passenger Routes (Standard Layout with Navbar and Footer) */}
          <Route
            path="*"
            element={
              <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/books" element={<BooksPage />} />
                    <Route path="/books/:id" element={<BookDetailsPage />} />
                    <Route path="/libraries" element={<LibrariesPage />} />
                    <Route path="/rent" element={<RentalPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/rentals/:id" element={<RentalDetailsPage />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
