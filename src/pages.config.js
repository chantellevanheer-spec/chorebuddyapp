import Account from './pages/Account';
import Admin from './pages/Admin';
import Chores from './pages/Chores';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import Help from './pages/Help';
import Home from './pages/Home';
import Index from './pages/Index';
import JoinFamily from './pages/JoinFamily';
import PaymentCancel from './pages/PaymentCancel';
import PaymentSuccess from './pages/PaymentSuccess';
import People from './pages/People';
import Pricing from './pages/Pricing';
import Privacy from './pages/Privacy';
import RoleSelection from './pages/RoleSelection';
import Schedule from './pages/Schedule';
import Store from './pages/Store';
import ChoreHistory from './pages/ChoreHistory';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Account": Account,
    "Admin": Admin,
    "Chores": Chores,
    "Dashboard": Dashboard,
    "Goals": Goals,
    "Help": Help,
    "Home": Home,
    "Index": Index,
    "JoinFamily": JoinFamily,
    "PaymentCancel": PaymentCancel,
    "PaymentSuccess": PaymentSuccess,
    "People": People,
    "Pricing": Pricing,
    "Privacy": Privacy,
    "RoleSelection": RoleSelection,
    "Schedule": Schedule,
    "Store": Store,
    "ChoreHistory": ChoreHistory,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};