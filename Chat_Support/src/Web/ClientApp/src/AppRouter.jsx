import { Routes, Route } from 'react-router-dom';
import Chat from './components/Chat/Chat.jsx';
import { ChatProvider } from './contexts/ChatContext.jsx';

const AppRouter = () => (
  <Routes>
    <Route path="/chat/*" element={
      <ChatProvider>
        <Chat />
      </ChatProvider>
    } />
    {/* سایر صفحات را اینجا اضافه کنید */}
  </Routes>
);

export default AppRouter;
