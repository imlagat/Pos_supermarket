import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ChatWidget from '../AIChatbot/ChatWidget';

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-100">
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}
