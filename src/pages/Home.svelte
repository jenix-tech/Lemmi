<script>
  import { home, pages } from '../strings';
  const { freetrial, blurb, help, anatomy } = home;

  let carouselIndex = 0

  const next = () =>
    carouselIndex = (carouselIndex + 1) % freetrial.images.length
  const previous = () =>
    carouselIndex = (carouselIndex - 1) % freetrial.images.length

  export let handleClickNavigation;

</script>

<section class="home-freetrial">
  <div class="wrapper">
    <div class="home-freetrial__text">
      <h2>{freetrial.title}</h2>
      <p>{freetrial.subtitle}</p>
      <button on:click={handleClickNavigation(pages.pricing)}>Get 1 week free</button>
      <p class="home-freetrial__smallprint">{freetrial.desciption}</p>
    </div>
    <div class="home-freetrial__carousel">
      <div class="carousel_image">
        <button class="carousel_prev" on:click={previous}>
          <img src="./images/chevron-left.svg" alt="View previous screenshot" />
        </button>
        {#each freetrial.images as photo, index}
          {#if index == carouselIndex}
            <img src={photo} alt="Screenshot of Lemmi running on iOS" />
          {/if}
        {/each}
        <button class="carousel_next" on:click={next}>
          <img src="./images/chevron-right.svg" alt="View next screenshot" />
        </button>
      </div>
    </div>
  </div>
</section>
<section class="blurb">
  <p>{blurb.text1}</p>
  <p>{blurb.text2}</p>
  <button 
    on:click={handleClickNavigation(pages.app)}>{blurb.action}</button>
</section>
<section class="help">
  <h3>{help.title}</h3>
  <div class="usp-wrapper">
    {#each help.usps as usp}
      <div class="usp">
        <div class="usp-image-wrapper">
          <img src={usp.image} alt={usp.title} />
        </div>
        <p class="usp-title">{usp.title.toUpperCase()}</p>
        <p class="usp-description">{usp.description}</p>
      </div>
    {/each}
  </div>
</section>
<section class="anatomy">
  <div class="wrapper">
    <img class="mock-up" src="images/anatomy.png" alt="Anatomy of the Lemmi app">
    <div class="anatomy-wrapper">
      {#each anatomy as item}
        <div class="anatomy-item reversed">
          <img class="anatomy-icon" src={item.image} alt={item.title} />
          <div class="anatomy-text">
            <p>{item.title.toUpperCase()}</p>
            <p>{item.desciption}</p>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .home-freetrial {
    height: 23rem;
    background-color: #25548c;
    color: #ffffff;
  }

  .wrapper {
    display: flex;
    height: 100%;
    max-width: 1000px;
    margin: 0 auto;
    align-items: center;
    justify-content: center
  }

  .home-freetrial__text {
    width: 40%;
  }

  .home-freetrial__text h2, .home-freetrial__text p {
    margin-bottom: 15px;
  }

  .home-freetrial__text button {
    margin: 10px 0 20px 0;
    width: 60%;
    height: 40px;
    font-size: 18px;
    font-weight: 600;
    border-radius: 5px;
    cursor: pointer;
    box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;
  }

  .home-freetrial__smallprint {
    font-size: 11px;
  }

  .home-freetrial__carousel {
    width: 26%;
  }

  .home-freetrial__carousel {
    overflow: hidden;
    position: relative;
    display: flex;
    justify-content: center;
    height: 100%;
  }

  .carousel_image {
    position: absolute;
    top: 40px;
  }

  .carousel_image img {
    width: 210px;
    height: auto;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }

  .carousel_image button {
    position: absolute;
    top: 35%;
    padding: 0;
    margin: 0;
    display: flex;
    align-items: center;
  }

  .carousel_image button img {
    position: relative;
    width: 100%;
  }

  .carousel_prev {
    height: 50px;
    width: 25px;
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
    left: -22px;
    background: #ffffff8c;
    border: none;
  }

  .carousel_next {
    height: 50px;
    width: 25px;
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
    right: -22px;
    background: #ffffff8c;
    border: none;
  }

  .blurb {
    height: 17rem;
    font-size: 19px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    max-width: 650px;
    margin: 0 auto;
    text-align: center;
    padding: 20px 0;
  }

  .blurb p {
    margin-bottom: 15px;
  }
  
  .blurb button {
    background: none;
    font-weight: 700;
    cursor: pointer;
  }

  .blurb button:hover {
    text-decoration: underline
  }

  .help {
    height: 17rem;
    padding: 5px 0 10px 0;
    background-color: #25548c;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .help h3 {
    margin: 20px 0;
    text-align: center;
  }

  .usp-wrapper {
    display: flex;
    justify-content: space-evenly;
    margin-top: 10px;
    max-width: 1010px;
  }

  .usp {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    width: 30%;
  }

  .usp-image-wrapper {
    background: #ffffff;
    height: 65px;
    width: 65px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    box-shadow: rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px;
  }

  .usp-image-wrapper img {
    height: 45px;
  }

  .usp-title {
    font-size: 1.2rem;
    font-weight: 700;
    margin: 15px 0;
  }

  .usp-description {
    font-size: 0.75rem;
  }

  .anatomy {
    height: 30rem;
    font-size: 19px;
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    align-items: center;
    margin: 0 auto;
    text-align: center;
    padding: 20px 0;
    background-color: #ffffff;
  }

  .wrapper {
    max-width: 1000px;
  }

  .mock-up {
    max-height: 100%;
    width: 100%;
  }

  .anatomy-wrapper {
    display: none;
    flex-direction: column;
    justify-content: space-between;
    height: 80%;
    margin: 20px 0;
  }

  .anatomy-item {
    display: flex;
    flex-direction: row;
    text-align: left;
  }

  .anatomy-item img {
    height: 30px;
    margin: 0 10px;
  }

  .anatomy-text {
    font-size: 1rem;
  }

  @media screen and (max-width: 936px) {
    .home-freetrial__carousel {
      width: 35%;
    }

    .home-freetrial__text {
      width: 40%;
    }

    .carousel_image {
      top: 45px;
    }

    .mock-up {
      height: auto;
    }
  }

  @media screen and (max-width: 767px) {
    .home-freetrial {
      height: 40rem;
    }
    .wrapper {
      flex-direction: column-reverse;
      text-align: center;
    }
    .home-freetrial__carousel, .home-freetrial__text {
      width: 100%;
    }

    .help {
      height: 43rem;
    }

    .blurb {
      height: 18rem;
      padding: 25px;
    }
  
    .carousel_image button {
      top: 40%;
    }

    .anatomy {
      height: 30rem;
    }

    .anatomy-wrapper {
      height: 100%;
      margin: 0;
    }

    .anatomy-item {
      margin: 10px 0;
    }
  }
  @media screen and (max-width: 674px) {
    .mock-up {
      display: none;
    }

    .anatomy-wrapper {
      display: flex;
    }

    .usp-wrapper {
      flex-direction: column;
      align-items: center;
    }

    .usp {
      margin: 20px 0;
      width: 80%;
    }
  }
</style>