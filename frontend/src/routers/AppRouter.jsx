import React from 'react'
import { Route, Routes } from 'react-router-dom';
import { privateRouter, adminRouter, publicRouter } from './routers.jsx';
import DefaultLayout from '~/components/layouts/DefaultLayout/DefaultLayout.jsx';
import AdminLayout from '~/components/adminLayouts/AdminLayouts.jsx';
import PrivateRoute from './PrivateRouter.jsx';

function AppRouter() {
    return (
        //public router
        <Routes>
            {publicRouter.map((item, index) => {

                const Layout =
                    item.layout === null
                        ? React.Fragment
                        : DefaultLayout;

                return (

                    <Route
                        key={index}
                        path={item.path}
                        element={
                            <Layout>
                                {item.element}
                            </Layout>
                        }
                    />

                );
            })}
        {/* private router */}
            {privateRouter.map((item, index) => (
                <Route key={index} path={item.path} element={
                    <PrivateRoute>
                        <DefaultLayout>
                            {item.element}
                        </DefaultLayout>
                    </PrivateRoute>
                }></Route>
            ))}
        {/* admin router */}
            {adminRouter.map((item, index) => (
                <Route key={index} path={item.path} element={
                    <PrivateRoute>
                        <AdminLayout>
                            {item.element}
                        </AdminLayout>
                    </PrivateRoute>
                }></Route>
            ))}
        </Routes>
    )
}
export default AppRouter;
