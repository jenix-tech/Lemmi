<script>
  import { _ } from "../services/i18n";
</script>

<!-- <section class="about-intro">
  <h2>"{heading}"</h2>
</section> -->
<div class="about-title">
  <h2>{$_('about.vision.title').toUpperCase()}</h2>
</div>
<article class="vision">
  <p>{$_('about.vision.text')}</p>
</article>
<div class="about-title">
  <h2>{$_('about.story.title').toUpperCase()}</h2>
</div>
<article class="story">
  <section class="timeline">
    <div class="container">
      {#each $_('about.story.timeline') as event}
        <div class="timeline-item">
          <div class="timeline-img">
            <img src={event.image} alt="Timeline icon"/>
          </div>
          <div class="timeline-content js--fadeInLeft">
            <h2>{event.date}</h2>
            <p>{event.text}</p>
          </div>
        </div> 
      {/each}
    </div>
  </section>
</article>
<div class="about-title">
  <h2>{$_('about.team.title').toUpperCase()}</h2>
</div>
<article class="team">
  <div class="team-wrapper">
    {#each $_('about.team.people') as person}
      <div class="team-member">
        <img src={person.image} alt={`Picture of ${person.name}`}/>
        <h3 class="team-name">{person.name}</h3>
        <h3 class="team-role">{person.role}</h3>
      </div>
    {/each}
  </div>
</article>

<style>
  .about-intro {
    height: 7rem;
    background: #f1f1f1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 0 10px;
  }

  .about-intro h2 {
    margin-bottom: 10px;
  }

  .about-intro h2 {
    max-width: 800px;
  }

  .about-title {
    width: 100%;
    background-color: #25548c;
    color: #ffffff;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    text-align: center;
  }

  article {
    display: flex;
    flex-direction: column;
    margin: 0 auto;
    max-width: 800px;
    text-align: center;
    margin-bottom: 20px;
  }

  .vision {
    height: 6rem;
    margin-top: 15px;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .story {
    margin-top: 30px;
  }

  .timeline {
    position: relative;
  }
  .timeline::before {
    content: '';
    background: #25548c;
    width: 5px;
    height: 100%;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }
  .timeline-item {
    width: 100%;
    margin-bottom: 70px;
  }
  .timeline-item:nth-child(even) .timeline-content {
    float: right;
  }
  .timeline-item:nth-child(even) .timeline-content::after {
    content: '';
    position: absolute;
    border-style: solid;
    width: 0;
    height: 0;
    top: 30px;
    left: -10px;
    border-width: 10px 15px 10px 0;
    border-color: transparent #f5f5f5 transparent transparent;
  }
  .timeline-item::after {
    content: '';
    display: block;
    clear: both;
  }
  .timeline-content {
    position: relative;
    width: 22rem;
    border-radius: 4px;
    padding: 20px 10px;
    background: #f5f5f5;
    border: 1px solid #25538c4f;
    box-shadow: 0 20px 25px -15px rgba(0, 0, 0, .3);
  }

  .timeline-content h2 {
    color: #25548C;
    margin-bottom: 5px;
  }
  .timeline-content::after {
    content: '';
    position: absolute;
    border-style: solid;
    width: 0;
    height: 0;
    top: 30px;
    right: -10px;
    border-width: 10px 0 10px 15px;
    border-color: transparent transparent transparent #f5f5f5;
  }
  .timeline-img {
    width: 40px;
    height: 40px;
    background: #ABE0E8;
    border-radius: 50%;
    position: absolute;
    left: 50%;
    margin-top: 25px;
    margin-left: -20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .timeline-img img {
    height: 30px;
    width: 30px;
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
    color: #071527;
  }

  @media screen and (max-width: 619px) {
    .about-intro {
      height: 10rem;
    }
    article {
      margin: 0 10px;
    }
    
    .vision {
      height: 12rem;
      margin-top: 0px;
    }

    .team-wrapper {
      flex-direction: column;
    }

    .team-member {
      margin: 20px;
    }
  }
  @media screen and (max-width: 768px) {
    .timeline::before {
      left: 2rem;
    }
    .timeline .timeline-img {
      left: 2rem;
    }
    .timeline .timeline-content {
      max-width: 100%;
      width: auto;
      margin-left: 4rem;
      padding: 10px 20px;
    }
    .timeline .timeline-item:nth-child(even) .timeline-content {
      float: none;
    }
    .timeline .timeline-item:nth-child(odd) .timeline-content::after {
      content: '';
      position: absolute;
      border-style: solid;
      width: 0;
      height: 0;
      top: 30px;
      left: -10px;
      border-width: 10px 15px 10px 0;
      border-color: transparent #f5f5f5 transparent transparent;
    }
}
</style>