import React from 'react';
import Home from '~/pages/home/Home.jsx';
import LoginPage from '../pages/auth/Login.jsx';
import AdminLoginPage from '../pages/auth/adminLogin.jsx';

import Dashboard from '../pages/admin/dashboard/Dashboard.jsx';
import UserManagement from '../pages/admin/users/UserManagement.jsx';
import PlaceManagement from '../pages/admin/place/PlaceManagement.jsx';

import Chatbot from '../pages/chatbot/chatbot.jsx';
import Maps from "~/pages/maps/Maps.jsx";
import Nearby from "~/pages/nearby/Nearby.jsx";
import Recommendations from "~/pages/recommendation/Recommendation.jsx";
import Itinerary from "~/pages/itinerary/Itinerary.jsx";
import OAuthRedirect from "~/pages/auth/OAuthRedirect.jsx";

const publicRouter = [
    {path: '/login', element: <LoginPage/>, layout: null},
    {path: '/admin/login', element: <AdminLoginPage/>, layout: null},
    {path: '/oauth2/redirect', element: <OAuthRedirect/>, layout: null},
    {path: '/', element: <Home/>},
]

const adminRouter = [
    {path: '/admin', element: <Dashboard/>},
    {path: '/admin/users', element: <UserManagement/>},
    {path: '/admin/places', element: <PlaceManagement/>},
]

const privateRouter = [
    {path: '/chatbot', element: <Chatbot/>},
    {path: '/maps', element: <Maps/>},
    {path: '/nearby', element: <Nearby/>},
    {path: '/recommendations', element: <Recommendations/>},
    {path: '/itinerary', element: <Itinerary/>},
]

export {adminRouter, publicRouter, privateRouter};
