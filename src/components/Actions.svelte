<script>
  import { actions, links } from "../strings.js";
  const { contact, waitlist, social } = actions;
  let email;
  let successMsg = waitlist.success;
  let errorMsg;
  let waitlistSuccess = false;
  let waitlistMsg;
  async function handleSubmit() {
    const url =
      "https://bize978r9h.execute-api.us-east-2.amazonaws.com/Production/join-waitlist";
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ email })
    });
    const response = await res.json();
    if (response.statusCode && response.statusCode === 200) {
      waitlistSuccess = true;
      waitlistMsg = successMsg;
    } else {
      waitlistSuccess = false;
      waitlistMsg = errorMsg;
    }
  }
</script>

<style>
  .actions-wrapper {
    display: flex;
    flex-direction: column;
    height: 500px;
    justify-content: space-around;
    align-items: center;
  }

  .contact-wrapper,
  .sign-up-wrapper,
  .social-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .heading {
    font-size: 2.25rem;
  }

  .email {
    font-size: 1.5rem;
    margin-left: 10px;
    color: #304e87;
    display: flex;
    align-items: center;
  }

  .email:hover {
    text-decoration: none;
  }

  .contact {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 35px;
    margin-top: 20px;
  }

  .sign-up {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  .contact-img {
    width: 30px;
    margin-right: 5px;
  }

  .wait-list {
    border: none;
    background: #d8faff;
    margin: 0;
    width: 250px;
    margin: 20px 0;
  }

  .submit {
    border: none;
    margin: 0 0 0 10px;
    color: #ffffff;
    font-weight: 500;
    background: #304e87;
    border-radius: 5px;
    width: 100px;
    cursor: pointer;
  }

  .message {
    margin-top: 20px;
    font-weight: 500px;
    font-size: 1rem;
    color: #fb394a;
  }

  .success {
    color: #333333;
  }

  .social-links {
    display: flex;
    margin-top: 20px;
  }

  .social-icon {
    width: 30px;
    margin: 0 10px;
    cursor: pointer;
  }

  @media only screen and (min-width: 600px) {
    .actions-wrapper {
      flex-direction: row;
    }

    .sign-up {
      flex-direction: row;
      margin-top: 20px;
    }

    .wait-list {
      margin: 0;
    }
  }
</style>

<div class="actions-wrapper">
  <div class="contact-wrapper">
    <p class="heading">{contact.heading}</p>
    <div class="contact">
      <a
        class="email"
        href="mailto:lemmichat@gmail.com?subject=Contact from Website">
        <img class="contact-img" src="images/mail.svg" alt="contact icon" />
        <p>{contact.link}</p>
      </a>
    </div>
  </div>
  <div class="sign-up-wrapper">
    <p class="heading">{waitlist.heading}</p>
    {#if waitlistMsg}
      <p class="message" class:success={waitlistSuccess}>{waitlistMsg}</p>
    {:else}
      <div class="sign-up">
        <input
          id="wait-list"
          class="wait-list"
          name="wait-list"
          type="email"
          bind:value={email} />
        <button id="submit" class="submit" on:click={handleSubmit}>
          {waitlist.button}
        </button>
      </div>
    {/if}
  </div>
  <div class="social-wrapper">
    <p class="heading">{social.heading}</p>
    <div class="social-links">
      <a href={links.twitter} rel="noopener" target="_blank">
        <img class="social-icon" src="images/twitter.svg" alt="social-icon" />
      </a>
      <a href={links.instagram} rel="noopener" target="_blank">
        <img class="social-icon" src="images/instagram.svg" alt="social-icon" />
      </a>
      <a href={links.facebook} rel="noopener" target="_blank">
        <img class="social-icon" src="images/facebook.svg" alt="social-icon" />
      </a>
    </div>
  </div>
</div>
