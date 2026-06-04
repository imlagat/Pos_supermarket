import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Discounts from './pages/Discounts';
import Customers from './pages/Customers';
import Inventory from './pages/Inventory';
import Transactions from './pages/Transactions';
import Users from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Suppliers from './pages/Suppliers';
import InventoryOrders from './pages/InventoryOrders';
import PurchaseOrders from './pages/PurchaseOrders';
import Returns from './pages/Returns';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import ReturnedItems from './pages/ReturnedItems';

function App() {
    return (
        <>
            <Toaster position="top-right" />
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route element={<ProtectedRoute />}>
                        <Route element={<Layout />}>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/pos" element={<POS />} />
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
                            <Route path="/returned-items" element={<ReturnedItems />} />   {/* add this line */}
                            <Route path="/reports" element={<Reports />} />
                        </Route>
                    </Route>
                </Routes>
            </BrowserRouter>
        </>
    );
}
export default App;
