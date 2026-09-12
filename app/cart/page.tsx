import CartPageContent from '../../components/CartPageContent';
import Footer from '../../components/Footer';
import Nav from '../../components/Nav';

export default function CartPage() {
  return (
    <>
      <Nav />
      <main className="bg-bg"><CartPageContent /></main>
      <Footer />
    </>
  );
}
