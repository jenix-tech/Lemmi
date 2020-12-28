<script>
  import { actions, links } from "../strings.js";
  const { newsletter } = actions;
  let email;
  let successMsg = newsletter.success;
  let newsletterSuccess = false;
  let newsletterMsg;
  async function handleSubmit() {
    const url =
      "https://bize978r9h.execute-api.us-east-2.amazonaws.com/Production/join-newsletter";

    newsletterSuccess = true;
    newsletterMsg = successMsg;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email })
    });



    const response = await res.json();
    if (response.statusCode && response.statusCode === 200) {
      newsletterSuccess = true;
      newsletterMsg = successMsg;
    } else {
      const body = JSON.parse(response.body);
      newsletterSuccess = false;
      newsletterMsg = body.message;
    }
  }
  function onInputChange(e) {
    if (!newsletterMsg) {
      return;
    }
    if (e.target.value === "" && newsletterMsg) {
      newsletterMsg = null;
    }
  }
</script>

<style>
  footer {
    background-color: #ffffff;
  }
  .footer-content {
    display: flex;
    flex-direction: column;
    max-width: 1100px;
    margin: 0 auto;
    padding: 15px 40px;
    justify-content: center;
    align-items: center;
  }

  .subscribe-wrapper {
    margin-top: auto;
  }

  .subscribe {
    margin: 15px 0;
    display: flex;
    justify-content: center;
  }

  .subscribe input {
    margin-right: 10px;
    width: 25vw;
    height: 35px;
    font-size: 0.80rem;
  }

  .subscribe input::placeholder {
    padding: 0;
    margin: 0;
  }
  
  .subscribe button {
    background: #25548C;
    color: #ffffff;
    padding: 0 10px;
  }

  .social-links {
    margin-bottom: 10px;
  }

  .social-icon {
    width: 20px;
    margin: 0 3px;
    cursor: pointer;
  }

  .social-icon:hover {
    opacity: 0.8;
  }
  
  .navigation,
  .copywrite {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .copywrite p {
    margin: 0;
  }
  
  .memorial {
    margin: 0 15px;
  }

  .navigation a {
    color: #304e87;
    margin: 0 5px;
  }

  .small-print {
    display: flex;
    font-size: 10px;
    justify-content: center;
    align-items: center;
    margin-top: auto;
  }
  .navigation-wrapper {
    display: flex;
  }

  .success, .message {
    margin: 20px 0;
  }

  .message {
    color: #ce0e0e
  }

  .success {
    color: #01a116
  }

  @media screen and (max-width: 767px) { 
    .footer-content {
      padding: 15px 20px;
      text-align: center;
    }

    .subscribe {
      flex-direction: column;
      max-width: 80vw;
      margin: 15px auto 20px auto;
    }

    .subscribe input {
      width: 100%;
      height: 40px;
      margin: 0 0 10px 0;
    }

    .subscribe button {
      height: 40px;
    }

    .social-links {
      width: 80vw;
      display: flex;
      justify-content: space-evenly;
    }

    .social-icon {
      width: 30px;
    }

    .small-print {
      flex-direction: column;
    }

    .navigation-wrapper {
      margin-top: 10px;
    }
  }
</style>

<footer id="footer">
  <div class="footer-content">
    <div class="subscribe-wrapper">
      <p class="heading">{newsletter.heading}</p>
      {#if newsletterMsg && newsletterSuccess}
        <p class="message" class:success={newsletterSuccess}>{newsletterMsg}</p>
      {:else}
      {#if newsletterMsg && !newsletterSuccess}
        <p class="message">{newsletterMsg}</p>
      {/if}
      <div class="subscribe">
        <input
          id="newletter"
          name="newletter"
          type="email"
          placeholder="EMAIL ADDRESS"
          aria-label="Newsletter Sign Up"
          required
          bind:value={email}
          on:input={onInputChange} />
        <button id="submit" class="submit" on:click={handleSubmit}>
          {newsletter.button.toUpperCase()}
        </button>
      </div>
      {/if}
  </div>
  <div class="social-links">
    <a href={links.email} rel="noopener" target="_blank">
      <img class="social-icon" src="images/email.svg" alt="social-icon" />
    </a>
    <a href={links.twitter} rel="noopener" target="_blank">
      <img class="social-icon" src="images/twitter.svg" alt="social-icon" />
    </a>
    <a href={links.facebook} rel="noopener" target="_blank">
      <img class="social-icon" src="images/facebook.svg" alt="social-icon" />
    </a>
    <a href={links.instagram} rel="noopener" target="_blank">
      <img class="social-icon" src="images/instagram.svg" alt="social-icon" />
    </a>
  </div>
  <div class="small-print">
    <div class="copywrite">
      <p>&copy; 2020 Jenix Technologies LTD</p>
    </div>
    <p class="memorial">Dedicated to N. Lemmikki Hyry</p>
    <div class="navigation-wrapper">
      <div class="navigation">
        <a href="/privacy-policy.html">Privacy Policy</a>
        <a href="/terms-of-service.html">Terms of Service</a>
      </div>
    </div>
  </div>
  </div>
</footer>
