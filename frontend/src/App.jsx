import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React, { Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import PageLoader from './components/common/PageLoader';

// Lazy loaded pages
const Login = React.lazy(() => import('./pages/Login'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const POS = React.lazy(() => import('./pages/POS'));
const Products = React.lazy(() => import('./pages/Products'));
const Discounts = React.lazy(() => import('./pages/Discounts'));
const Customers = React.lazy(() => import('./pages/Customers'));
const Inventory = React.lazy(() => import('./pages/Inventory'));
const Transactions = React.lazy(() => import('./pages/Transactions'));
const Users = React.lazy(() => import('./pages/Users'));
const AuditLogs = React.lazy(() => import('./pages/AuditLogs'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Suppliers = React.lazy(() => import('./pages/Suppliers'));
const InventoryOrders = React.lazy(() => import('./pages/InventoryOrders'));
const PurchaseOrders = React.lazy(() => import('./pages/PurchaseOrders'));
const Returns = React.lazy(() => import('./pages/Returns'));
const ReturnedItems = React.lazy(() => import('./pages/ReturnedItems'));
const RemoteScannerApp = React.lazy(() => import('./pages/RemoteScannerApp'));
const ShiftsReport = React.lazy(() => import('./pages/ShiftsReport'));
const Finance = React.lazy(() => import('./pages/Finance'));
const CashDrawer = React.lazy(() => import('./pages/CashDrawer'));

function App() {
    return (
        <>
            <Toaster position="top-right" />
            <BrowserRouter>
                <Suspense fallback={<PageLoader message="Loading page..." />}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/remote-scanner/:sessionId" element={<RemoteScannerApp />} />
                        <Route element={<ProtectedRoute />}>
                            <Route element={<Layout />}>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/pos" element={<POS />} />
                                <Route path="/cash-drawer" element={<CashDrawer />} />
                                <Route path="/products" element={<Products />} />
                                <Route path="/discounts" element={<Discounts />} />
                                <Route path="/customers" element={<Customers />} />
                                <Route path="/inventory" element={<Inventory />} />
                                <Route path="/transactions" element={<Transactions />} />
                                <Route path="/users" element={<Users />} />
                                <Route path="/audit-logs" element={<AuditLogs />} />
                                <Route path="/reports" element={<Reports />} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/suppliers" element={<Suppliers />} />
                                <Route path="/inventory-orders" element={<InventoryOrders />} />
                                <Route path="/purchase-orders" element={<PurchaseOrders />} />
                                <Route path="/returns" element={<Returns />} />
                                <Route path="/returned-items" element={<ReturnedItems />} />
                                <Route path="/shifts" element={<ShiftsReport />} />
                                <Route path="/finance" element={<Finance />} />
                            </Route>
                        </Route>
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </>
    );
}
export default App;
