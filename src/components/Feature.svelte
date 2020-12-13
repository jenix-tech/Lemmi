<script>
  export let image;
  export let title;
  export let description;
  export let index;
</script>

<style>
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
    margin-bottom: 30px;
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
</style>

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
