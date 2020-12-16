<script>
  import { about } from '../strings';
  const { story, team } = about;
</script>

<div class="about-title">
  <h2>{story.title.toUpperCase()}</h2>
</div>
<article class="story">
  <header>
    <blockquote>
        "{story.heading.toUpperCase()}"
    </blockquote>
  </header>
  {#each story.sections as section}
    <section>
      {#each section as paragraph}
        <p>{paragraph}</p>
      {/each}
    </section>
  {/each}
</article>
<div class="about-title">
  <h2>{team.title.toUpperCase()}</h2>
</div>
<article class="team">
  <div class="team-wrapper">
    {#each team.people as person}
      <div class="team-member">
        <img src={person.image} alt={`Picture of ${person.name}`}/>
        <h3 class="team-name">{person.name}</h3>
        <h3 class="team-role">{person.role}</h3>
      </div>
    {/each}
  </div>
</article>

<style>
  .about-title {
    width: 100%;
    background-color: #25548c;
    color: #ffffff;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
  }

  article {
    display: flex;
    flex-direction: column;
    margin: 0 auto;
    max-width: 800px;
    text-align: center;
    margin-bottom: 20px;
  }

  .story header {
    margin: 5px 0;
    font-size: 1.5rem;
    color: #25548c;
    font-weight: 600;
  }

  .story section {
    background-color: #ffffff;
    margin-bottom: 20px;
    font-size: 1.1rem;
    padding: 20px 20px 0px 20px;
    border-radius: 10px;
    box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;
  }

  .story p {
    margin-bottom: 20px;
  }

  .team {
    margin-top: 30px;
  }

  .team-wrapper {
    display: flex;
    justify-content: center;
    align-items: center
  }

  .team-member {
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    margin: 0 40px;
  }

  .team-member h3 {
    font-weight: 600;
  }

  .team-member img {
    height: 13rem;
    margin-bottom: 15px;
    border-radius: 10px;
    box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;
  }

  .team-name {
    color: #25548c;
  }

  .team-role {
    color: #ffffff;
  }

  @media only screen and (max-width: 619px) {
    article {
      margin: 0 10px;
    }
    .team-wrapper {
      flex-direction: column;
    }
  }
</style>