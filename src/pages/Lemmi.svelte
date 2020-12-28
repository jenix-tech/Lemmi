<script>
  import { _ } from "../services/i18n";
</script>

<div class="lemmi-title">
  <h3>{$_('app.header').toUpperCase()}</h3>
</div>
<section class="features">
  {#each $_('app.features') as { title, description, image }, index}
    <div class="feature" class:right={index % 2 !== 0}>
      <img
        class="feature-image"
        src={image}
        alt="{title} image" />
      <div class="text-wrapper">
        <h3 class="feature-title">{title}</h3>
        <p class="feature-description">{description}</p>
      </div>
    </div>
  {/each}
</section>

<style>
  .lemmi-title {
    width: 100%;
    background-color: #25548c;
    color: #ffffff;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    margin-bottom: 40px;
  }
  .lemmi-title h3 {
    max-width: 800px;
    text-align: center;
  }
  .features {
    max-width: 600px;
    margin: 0 auto;
  }

  .feature {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    margin-bottom: 50px;
  }

  .feature-image {
    width: 150px;
    flex-direction: column;
  }

  .text-wrapper {
    justify-content: center;
    align-items: center;
    display: flex;
    text-align: center;
    flex-direction: column;
    padding: 0 30px;
  }

  .feature-title {
    font-weight: 700;
    color: #25548c;
  }

  .feature-description {
    font-size: 1.25rem;
    margin: 0;
  }

  .right {
    flex-direction: row-reverse;
  }

  @media screen and (max-width: 619px) {
    .feature {
      flex-direction: column;
    }

    .lemmi-title h3 {
      font-size: 1rem;
    }
  }
</style>