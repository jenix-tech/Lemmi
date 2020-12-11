<script>
  import Header from "./components/Header.svelte";
  import Home from "./pages/Home.svelte";
  import Lemmi from "./pages/Lemmi.svelte";
  import Footer from "./components/Footer.svelte";
  import { pages } from "./strings";

  const components = {
    [pages.home]: Home,
    [pages.app]: Lemmi,
    // [pages.about]: About,
    // [pages.pricing]: Pricing,
    // [pages.faqs]: FAQS,
    // [pages.contact]: Contact
  };

  let page = pages.home;
  let handleClickNavigation = (selected) => {
    page = selected;
  };
</script>

<style>
</style>

<Header {page} {handleClickNavigation} />
<main>
  <svelte:component this={components[page]} {handleClickNavigation} />
</main>
<Footer />
