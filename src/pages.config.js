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
import AdminHealth from './pages/AdminHealth';
import Advice from './pages/Advice';
import Analytics from './pages/Analytics';
import AthleteInsights from './pages/AthleteInsights';
import ChallengeDetail from './pages/ChallengeDetail';
import Challenges from './pages/Challenges';
import Coach from './pages/Coach';
import CoachingSessionDetail from './pages/CoachingSessionDetail';
import CreatePost from './pages/CreatePost';
import CreatorAI from './pages/CreatorAI';
import CreatorHub from './pages/CreatorHub';
import CreatorShop from './pages/CreatorShop';
import Discover from './pages/Discover';
import Events from './pages/Events';
import Explore from './pages/Explore';
import Feed from './pages/Feed';
import ForYou from './pages/ForYou';
import ForumTopic from './pages/ForumTopic';
import Forums from './pages/Forums';
import GitHubExport from './pages/GitHubExport';
import GroupDetail from './pages/GroupDetail';
import Groups from './pages/Groups';
import Guidelines from './pages/Guidelines';
import Leaderboard from './pages/Leaderboard';
import Live from './pages/Live';
import LiveCoaching from './pages/LiveCoaching';
import Messages from './pages/Messages';
import MyTraining from './pages/MyTraining';
import Notifications from './pages/Notifications';
import Onboarding from './pages/Onboarding';
import OrgDashboard from './pages/OrgDashboard';
import OrgMessages from './pages/OrgMessages';
import OrgRoster from './pages/OrgRoster';
import OrgSessions from './pages/OrgSessions';
import ParentView from './pages/ParentView';
import Premium from './pages/Premium';
import Profile from './pages/Profile';
import ProfileSettings from './pages/ProfileSettings';
import Reels from './pages/Reels';
import SavedContent from './pages/SavedContent';
import Terms from './pages/Terms';
import TrainingPlanDetail from './pages/TrainingPlanDetail';
import TrainingPlans from './pages/TrainingPlans';
import TrendingChallenges from './pages/TrendingChallenges';
import UploadVideo from './pages/UploadVideo';
import UserProfile from './pages/UserProfile';
import VideoReview from './pages/VideoReview';
import ViewLive from './pages/ViewLive';
import SportHub from './pages/SportHub';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminHealth": AdminHealth,
    "Advice": Advice,
    "Analytics": Analytics,
    "AthleteInsights": AthleteInsights,
    "ChallengeDetail": ChallengeDetail,
    "Challenges": Challenges,
    "Coach": Coach,
    "CoachingSessionDetail": CoachingSessionDetail,
    "CreatePost": CreatePost,
    "CreatorAI": CreatorAI,
    "CreatorHub": CreatorHub,
    "CreatorShop": CreatorShop,
    "Discover": Discover,
    "Events": Events,
    "Explore": Explore,
    "Feed": Feed,
    "ForYou": ForYou,
    "ForumTopic": ForumTopic,
    "Forums": Forums,
    "GitHubExport": GitHubExport,
    "GroupDetail": GroupDetail,
    "Groups": Groups,
    "Guidelines": Guidelines,
    "Leaderboard": Leaderboard,
    "Live": Live,
    "LiveCoaching": LiveCoaching,
    "Messages": Messages,
    "MyTraining": MyTraining,
    "Notifications": Notifications,
    "Onboarding": Onboarding,
    "OrgDashboard": OrgDashboard,
    "OrgMessages": OrgMessages,
    "OrgRoster": OrgRoster,
    "OrgSessions": OrgSessions,
    "ParentView": ParentView,
    "Premium": Premium,
    "Profile": Profile,
    "ProfileSettings": ProfileSettings,
    "Reels": Reels,
    "SavedContent": SavedContent,
    "Terms": Terms,
    "TrainingPlanDetail": TrainingPlanDetail,
    "TrainingPlans": TrainingPlans,
    "TrendingChallenges": TrendingChallenges,
    "UploadVideo": UploadVideo,
    "UserProfile": UserProfile,
    "VideoReview": VideoReview,
    "ViewLive": ViewLive,
    "SportHub": SportHub,
}

export const pagesConfig = {
    mainPage: "Feed",
    Pages: PAGES,
    Layout: __Layout,
};