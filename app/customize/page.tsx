import CustomizeUpload from '../../components/CustomizeUpload';
import Footer from '../../components/Footer';
import Nav from '../../components/Nav';

export default function CustomizePage() {
  return (
    <>
      <Nav />
      <main>
        <CustomizeUpload />
      </main>
      <Footer />
    </>
  );
}
