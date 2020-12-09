<script>
  import Header from "./components/Header.svelte";
  import Lemmi from "./components/Lemmi.svelte";
  import Footer from "./components/Footer.svelte";
  import { pages } from "./strings";

  const components = {
    // [pages.home]: Home,
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
  main {
    max-width: 1000px;
    margin: 0 auto;
    padding: 60px 0 0 0;
  }
</style>

<Header {page} {handleClickNavigation} />
<main>
  <svelte:component this={components[page]} />
</main>
<Footer />
