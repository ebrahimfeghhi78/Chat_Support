// src/AppRouter.jsx

import { Routes, Route, Link } from 'react-router-dom';
import Chat from './components/Chat/Chat.jsx';
import { ChatProvider } from './contexts/ChatContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx'; 
import { useAuth } from './hooks/useAuth';

const Home = () => <h2>صفحه اصلی (عمومی)</h2>;

const AppRouter = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div>
      {/* <nav>
        <Link to="/">خانه</Link> | <Link to="/chat">چت</Link>
        {isAuthenticated && user && (
          <span style={{ marginLeft: '20px' }}>
            خوش آمدید, {user.firstName}!
            <button onClick={logout} style={{ marginLeft: '10px' }}>خروج از چت</button>
          </span>
        )}
      </nav>
      <hr /> */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/chat/*" 
          element={
            <ProtectedRoute>
              <ChatProvider>
                <Chat />
              </ChatProvider>
            </ProtectedRoute>
          } 
        />
        {/* سایر صفحات را اینجا اضافه کنید */}
      </Routes>
    </div>
  );
};

export default AppRouter;