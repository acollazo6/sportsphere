/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Advice from './pages/Advice';
import Coach from './pages/Coach';
import CreatePost from './pages/CreatePost';
import Explore from './pages/Explore';
import Feed from './pages/Feed';
import GroupDetail from './pages/GroupDetail';
import Groups from './pages/Groups';
import Live from './pages/Live';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Reels from './pages/Reels';
import UserProfile from './pages/UserProfile';
import ViewLive from './pages/ViewLive';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Advice": Advice,
    "Coach": Coach,
    "CreatePost": CreatePost,
    "Explore": Explore,
    "Feed": Feed,
    "GroupDetail": GroupDetail,
    "Groups": Groups,
    "Live": Live,
    "Messages": Messages,
    "Notifications": Notifications,
    "Profile": Profile,
    "Reels": Reels,
    "UserProfile": UserProfile,
    "ViewLive": ViewLive,
}

export const pagesConfig = {
    mainPage: "Feed",
    Pages: PAGES,
    Layout: __Layout,
};