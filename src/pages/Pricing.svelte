<script>
  import { pricing } from '../strings';

  const openStore = (store) => {
    if (store === 'app') {
      console.log('app')
    } else {
      console.log('play')
    }
  }
</script>

<style>
  .pricing-title {
    width: 100%;
    background-color: #25548c;
    color: #ffffff;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
  }

  .subscriptions {
    max-width: 800px;
    margin: 0 auto;
  }

  .subscriptions h2 {
    margin: 40px 0;
    font-weight: 500;
    text-align: center;
  }

  .subscriptions h4 {
    text-align: center;
  }

  .plans-wrapper, .included {
    display: flex;
    width: 100%;
    justify-content: center;
    margin-bottom: 25px;
  }

  .plan {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 35%;
    margin: 0 10px;
    background-color: #ffffff;
    box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;
    border-radius: 10px;
    height: 35vh;
  }

  .popular {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    top: -20px;
    height: 40px;
    width: 70%;
    border-radius: 40px;
    background-color: #FBCE33;
    color: #25548c;
    font-weight: 400;
  }

  .plan h1, .plan h2 {
    margin: 0;
  }

  .plan h1 {
    color: #25548c;
    margin-top: 20%;
  }

  .plan h2 {
    color: #ff0000;
  }

  .plan p {
    font-weight: 600;
    font-size: 0.8rem;
  }

  .perMonth {
    margin-top: 3px;
    margin-bottom: -6%;
  }

  .billing {
    margin-top: 20%;
  }

  .saving {
    position: absolute;
    bottom: 0;
    margin-bottom: 7%;
    height: 25px;
    color: #ffffff;
    background-color: #4EAF7C;
    width: 45%;
    border-radius: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .included {
    display: flex;
    flex-direction: column;
    background-color: #ffffff;
    border-radius: 10px;
    box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;
    padding: 40px 0;
    text-align: center;
  }

  .included h2 {
    color: #25548c;
    margin: 0 0 25px 0;
  }
  
  .included p {
    margin: 10px 0;
    font-size: 1.2rem;
  }

  .store-icons {
    margin: 20px 0 40px 0;
    display: flex;
    justify-content: center;
  }

  .store-icons button {
    cursor: pointer;
    padding: 0;
    background: none;
    border: none;
  }
  
  .store-icons button:hover img {
    opacity: 0.8;
  }

  .app-icon {
    height: 55px;
    margin: 0 10px 0 0;
  }

  .play-icon {
    height: 60px;
    margin: -1px 5px 0 0;
  }

  @media only screen and (min-width: 768px) {
    .plan {
      height: 30vh;
    }
  }
</style>

<div class="pricing-title">
  <h2>{pricing.title.toUpperCase()}</h2>
</div>
<section class="subscriptions">
  <h2>{pricing.subscription}</h2>
  <div class="plans-wrapper">
    {#each pricing.plans as plan}
      <div class="plan">
        {#if plan.popular}
          <h3 class="popular">{plan.popular}</h3>
        {/if}
        <h1 class="title">{plan.title}</h1>
        <h2 class="price">{plan.price}</h2>
        {#if plan.perMonth}
          <p class="perMonth">{plan.perMonth}</p>
        {/if}
        <p class="billing">{pricing.billing}</p>
        {#if plan.save}
          <h5 class="saving">{plan.save.toUpperCase()}</h5>
        {/if}
      </div>
    {/each}
  </div>
  <div class="included">
    <h2>{pricing.whatsIncluded}</h2>
    {#each pricing.included as included}
      <p>{included}</p>
    {/each}
  </div>
  <h4>{pricing.available}</h4>
  <div class="store-icons">
    <button
      on:click={() => openStore('app')}
    >
      <img
        class="app-icon"
        src="images/app-store.png"
        alt="Download on the App Store" />
    </button>
    <button
      on:click={() => openStore('play')}
    >
      <img
        class="play-icon"
        src="images/play-store.png"
        alt="Download on the Play Store" />
    </button>
  </div>
</section>