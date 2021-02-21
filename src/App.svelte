<script>
  import { getLocaleFromNavigator } from 'svelte-i18n';
  import { setupI18n, isLocaleLoaded } from "./services/i18n";

  import Header from "./components/Header.svelte";
  import Home from "./pages/Home.svelte";
  import Lemmi from "./pages/Lemmi.svelte";
  import About from "./pages/About.svelte";
  import Pricing from "./pages/Pricing.svelte";
  import FAQs from "./pages/FAQs.svelte";
  import Contact from "./pages/Contact.svelte";
  import Footer from "./components/Footer.svelte";
  import { pages } from "./strings";

  setupI18n({ withLocale: getLocaleFromNavigator() });

  const components = {
    [pages.home]: Home,
    [pages.app]: Lemmi,
    [pages.about]: About,
    [pages.pricing]: Pricing,
    [pages.faqs]: FAQs,
    [pages.contact]: Contact
  };

  let page = window.location.href.includes('/FAQs') ? pages.faqs : pages.home;
  let handleClickNavigation = (selected, scrollToTop = false) => {
    page = selected;
    if (scrollToTop) {
      window.scrollTo(0,0);
    }
  };
</script>

{#if $isLocaleLoaded}
  <Header {page} {handleClickNavigation} />
  <main>
    <svelte:component this={components[page]} {handleClickNavigation} />
  </main>
  <Footer />
{/if}

