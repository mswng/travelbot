import "./default-layout.scss";

import Header from "~/components/layouts/header/Header.jsx";
import Footer from "~/components/layouts/footer/Footer.jsx";

export default function DefaultLayout({ children }) {
    return (
        <div className="default-layout">
            <Header />

            <main className="layout-content">
                {children}
            </main>

            <Footer />
        </div>
    );
}