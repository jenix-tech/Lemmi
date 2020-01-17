<script>
  export let image;
  export let title;
  export let description;
  export let index;
</script>

<style>
  .feature {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-bottom: 80px;
  }

  .feature-image {
    width: 300px;
    flex-direction: column;
    margin-bottom: 30px;
  }

  .text-wrapper {
    justify-content: center;
    align-items: center;
    display: flex;
    flex-direction: column;
    padding: 0 30px;
  }

  .feature-title {
    font-weight: 500;
    font-size: 2.5rem;
    margin-bottom: 15px;
  }

  .feature-description {
    font-size: 1.25rem;
  }

  .right {
    flex-flow: column;
  }

  @media only screen and (min-width: 600px) {
    .feature {
      flex-direction: row;
      margin-bottom: 0;
    }

    .feature-image {
      height: 700px;
      width: auto;
      margin-bottom: 0;
    }

    .feature-title {
      margin-bottom: 0;
    }

    .feature-description {
      font-size: 1.5rem;
    }

    .right {
      flex-flow: row-reverse;
    }
  }
</style>

<div class="feature" class:right={index % 2 !== 0}>
  <img class="feature-image" src="images/{image}.png" alt="{title} image" />
  <div class="text-wrapper">
    <p class="feature-title">{title}</p>
    <p class="feature-description">{description}</p>
  </div>
</div>
