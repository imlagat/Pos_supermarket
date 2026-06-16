import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ChatWidget from '../AIChatbot/ChatWidget';

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden print:h-auto print:overflow-visible">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-100 print:bg-white print:overflow-visible print:p-0">
        <div className="p-4 md:p-6 print:p-0">
          <Outlet />
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}
