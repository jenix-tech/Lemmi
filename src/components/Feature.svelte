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
  .customisable {
    height: 500px !important;
  }

  .feature-image {
    width: 300px;
    flex-direction: column;
    margin-bottom: 30px;
    border-radius: 90px;
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
</style>

<div class="feature" class:right={index % 2 !== 0}>
  <img
    class={`feature-image ${image === 'customisable' ? 'customisable' : ''}`}
    src="images/{image}.gif"
    alt="{title} image" />
  <div class="text-wrapper">
    <h3 class="feature-title">{title}</h3>
    <p class="feature-description">{description}</p>
  </div>
</div>
