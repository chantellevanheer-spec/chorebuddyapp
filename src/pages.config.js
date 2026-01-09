import Dashboard from './pages/Dashboard';
import People from './pages/People';
import Chores from './pages/Chores';
import Schedule from './pages/Schedule';
import Store from './pages/Store';
import Pricing from './pages/Pricing';
import Home from './pages/Home';
import Account from './pages/Account';
import Privacy from './pages/Privacy';
import Help from './pages/Help';
import Index from './pages/Index';
import Analytics from './pages/Analytics';
import Goals from './pages/Goals';
import Admin from './pages/Admin';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import JoinFamily from './pages/JoinFamily';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "People": People,
    "Chores": Chores,
    "Schedule": Schedule,
    "Store": Store,
    "Pricing": Pricing,
    "Home": Home,
    "Account": Account,
    "Privacy": Privacy,
    "Help": Help,
    "Index": Index,
    "Analytics": Analytics,
    "Goals": Goals,
    "Admin": Admin,
    "PaymentSuccess": PaymentSuccess,
    "PaymentCancel": PaymentCancel,
    "JoinFamily": JoinFamily,
}

export const pagesConfig = {
    mainPage: "Index",
    Pages: PAGES,
    Layout: __Layout,
};