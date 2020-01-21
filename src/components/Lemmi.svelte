<script>
  import Feature from "./Feature.svelte";
  import Actions from "./Actions.svelte";
  import { hero, features } from "../strings.js";
</script>

<style>
  .hero {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin: 0 0 50px 0;
  }

  .logo {
    height: 80px;
    width: 80px;
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
  }

  .title {
    margin-top: 15px;
    text-transform: uppercase;
    font-size: 2rem;
    font-weight: 500;
  }

  .subtitle {
    font-size: 2.25rem;
    margin: 20px 0;
    font-weight: 500;
  }

  .description {
    margin-top: 10px;
    font-size: 1.25rem;
    width: 65%;
    text-align: center;
  }

  .store-icons {
    margin-top: 40px;
    display: flex;
    justify-content: space-around;
    width: 65%;
    flex-wrap: wrap;
  }

  .coming-soon {
    font-size: 1rem;
    margin-bottom: 60px;
  }

  .store-icons img {
    cursor: pointer;
  }

  .app-icon {
    height: 65px;
    flex-shrink: 1;
    margin: 5px 0;
  }

  .play-icon {
    height: 63px;
    flex-shrink: 1;
    margin: 5px 0;
  }

  .features {
    display: flex;
    flex-direction: column;
    margin-top: 100px;
  }

  @media only screen and (min-width: 600px) {
    .hero {
      margin: 50px 0 150px;
    }
    .description {
      font-size: 1.5rem;
    }
    .subtitle {
      font-size: 3rem;
      margin: 20px 0 0 0;
    }
    /* .coming-soon {
      font-size: 1rem;
      margin-bottom: 160px;
    } */
  }
</style>

<div class="hero">
  <div class="logo">
    <img src="images/appIcon.svg" alt="Lemmi Logo" />
  </div>
  <p class="title">{hero.title}</p>
  <p class="subtitle">{hero.subtitle}</p>
  <p class="description">{hero.description}</p>
  <div class="store-icons">
    <p class="coming-soon">Coming soon to Android and iOS.</p>
    <!-- <img
      class="app-icon"
      src="images/appStore.svg"
      alt="Download on App Store" />
    <img
      class="play-icon"
      src="images/playStore.svg"
      alt="Download on Play Store" /> -->
  </div>
</div>
<div class="features">
  {#each features as { title, description }, index}
    <Feature image={title.toLowerCase()} {title} {description} {index} />
  {/each}
</div>
<Actions />
