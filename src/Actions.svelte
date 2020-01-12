<script>
  import { actions } from "./strings.js";
  const { contact, waitlist } = actions;
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
    height: 500px;
    justify-content: space-around;
    align-items: center;
  }

  .contact-wrapper,
  .sign-up-wrapper {
    height: 360px;
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
  }

  .contact,
  .sign-up {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 35px;
    margin-top: 20px;
  }

  .contact-img {
    width: 30px;
  }

  .wait-list {
    border: none;
    background: #d8faff;
    margin: 0;
    width: 250px;
  }

  .submit {
    border: none;
    margin: 0 0 0 10px;
    color: #ffffff;
    font-weight: 500;
    background: #0c9caf;
    border-radius: 5px;
    width: 100px;
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
</style>

<div class="actions-wrapper">
  <div class="contact-wrapper">
    <p class="heading">{contact.heading}</p>
    <div class="contact">
      <img class="contact-img" src="images/mail.svg" alt="contact icon" />
      <a
        class="email"
        href="mailto:lemmichat@gmail.com?subject=Contact from Website">
        {contact.link}
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
</div>
