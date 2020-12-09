<script>
  import { hero, pages } from "../strings.js";
  export let page;
  export let handleClickNavigation;
</script>

<style>
  .hero {
    display: flex;
    justify-content: center;
    padding: 40px;
  }

  .hero-image {
    height: 290px;
    width: 290px;
  }

  .hero-info {
    display: flex;
    flex-direction: column;
    margin-left: 50px;
    width: 35%;
    max-width: 345px;
  }

  /* .logo {
    height: 120px;
    width: 120px;
    padding: 20px;
    border-radius: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #84c6d0;
    margin: 0 auto;
  }

  .logo img {
    height: 100%;
  } */

  .title {
    margin-top: 15px;
    font-size: 3rem;
    font-weight: 500;
  }

  .subtitle {
    font-size: 2.25rem;
    margin: 0;
    font-weight: 500;
  }

  .store-icons {
    margin-top: 20px;
    display: flex;
    flex-wrap: wrap;
  }

  .coming-soon {
    font-size: 1rem;
    margin-bottom: 60px;
  }

  .store-icons img {
    cursor: pointer;
  }

  nav {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 60px;
    background-color: #ffffff;
  }

  nav ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
  }

  nav button {
    margin: 0;
    background: none;
    border: none;
    font-size: 1.75rem;
    cursor: pointer;
    margin: 0 10px;
  }

  nav button:hover, nav button.selected {
    color: #25548c
  }

  @media only screen and (min-width: 600px) {
    .subtitle {
      font-size: 2.5rem;
      margin: 0;
    }
    .app-icon {
    height: 45px;
    margin: 0 10px 0 0;
    }

    .play-icon {
      height: 47px;
      margin: -1px 5px 0 0;
    }
  }
</style>

<div class="hero">
  <!-- <div class="logo">
    <img src="images/appIcon.svg" alt="Lemmi Logo" />
  </div> -->
  <img
    class="hero-image"
    src="images/hero-image.png"
    alt="Lemmi shown on an iPad and iPhone"
  />
  <div class="hero-info">
    <h1 class="title">{hero.title}</h1>
    <h3 class="subtitle">{hero.subtitle}</h3>
    <div class="store-icons">
      <img
        class="app-icon"
        src="images/app-store.png"
        alt="Download on the App Store" />
      <img
        class="play-icon"
        src="images/play-store.png"
        alt="Download on the Play Store" />
    </div>
  </div>
</div>
<nav>
  <ul>
    {#each Object.values(pages) as pageTitle}
      <li>
        <button
          on:click={() => handleClickNavigation(pageTitle)}
          class={`${page === pageTitle ? 'selected' : ''}`}
        >{pageTitle}</button>
      </li>
    {/each}
  </ul>
</nav>