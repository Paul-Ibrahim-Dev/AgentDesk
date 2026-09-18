import { Routes, Route } from 'react-router-dom';

import PublicLayout from './components/PublicLayout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import Pricing from './pages/Pricing';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import Demo from './pages/Demo';
import Login from './pages/Login';
import Register from './pages/Register';

import Overview from './pages/dashboard/Overview';
import BusinessProfile from './pages/dashboard/BusinessProfile';
import Services from './pages/dashboard/Services';
import Faqs from './pages/dashboard/Faqs';
import AgentConfig from './pages/dashboard/AgentConfig';
import Bookings from './pages/dashboard/Bookings';
import Conversations from './pages/dashboard/Conversations';
import ConversationDetail from './pages/dashboard/ConversationDetail';
import NewBusiness from './pages/dashboard/NewBusiness';

function NotFound() {
  return (
    <div className="surface-space min-h-screen flex items-center justify-center text-center py-24">
      <div>
        <h1 className="text-3xl font-display font-semibold text-paper">Page not found</h1>
        <p className="mt-2 text-paper/50">The page you're looking for doesn't exist.</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="new-business" element={<NewBusiness />} />
          <Route path="profile" element={<BusinessProfile />} />
          <Route path="services" element={<Services />} />
          <Route path="faqs" element={<Faqs />} />
          <Route path="agent" element={<AgentConfig />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="conversations" element={<Conversations />} />
          <Route path="conversations/:conversationId" element={<ConversationDetail />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
