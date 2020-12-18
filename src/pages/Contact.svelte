<script>
  import { contact } from '../strings';

  let first, last, email, feedback, success, error;

  async function handleSubmit(e) {
    const url =
      "https://bize978r9h.execute-api.us-east-2.amazonaws.com/Production/contact";
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ feedback, first, last, email })
    });
    const response = await res.json();
    if (response.statusCode && response.statusCode === 200) {
      success = contact.success;
      error = undefined;
      document.getElementById("contact-form").reset();
    } else {
      error = contact.error;
      success = undefined;
    }
    first = undefined;
    last = undefined;
    email = undefined;
    feedback = undefined;
  }
</script>

<div class="contact-title">
  <h2>{contact.title.toUpperCase()}</h2>
</div>
<section class="contact">
  <p>{contact.instructions}</p>
  <div class="form">
    <div class="form-wrapper">
      <div class="form-header">
        <h3>{contact.form}</h3>
        {#if success}
          <p class="success">{success}</p>
        {/if}
        {#if error}
          <p class="error">{error}</p>
        {/if}
      </div>
      <form id="contact-form">
        <div class="name">
          <div>
            <label for="first-name">First Name:*</label>
            <input 
              id="first-name" 
              type="text" 
              autocomplete="name"
              required
              on:change={(e) => first = e.target.value}
            />
          </div>
          <div>
            <label for="last-name">Last Name:</label>
            <input 
              id="last-name" 
              type="text" 
              autocomplete="additional-name"
              on:change={(e) => last = e.target.value}
            />
          </div>
        </div>
        <label for="email">Email:*</label>
        <input 
          type="email" 
          id="email" 
          required
          autocomplete="email"
          on:change={(e) => email = e.target.value}
        />
        <label for="message">Message:*</label>
        <textarea 
          id="message" 
          required
          on:change={(e) => feedback = e.target.value}
        />
      </form>
      <button on:click={handleSubmit}>{contact.submit.toUpperCase()}</button>
    </div>
  </div>
  <p>{contact.notes}</p>
</section>


<style>
  .contact-title {
    width: 100%;
    background-color: #25548c;
    color: #ffffff;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
  }

  .contact {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    max-width: 800px;
    margin: 0 auto;
  }

  .contact p {
    text-align: center;
    margin: 40px 0;
  }

  .form {
    background-color: #ffffff;
    width: 100%;
    border-radius: 5px;
    box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;
  }

  .form-wrapper {
    padding: 20px 0;
    width: 60%;
    margin: 0 auto;
  }

  .form-wrapper h3 {
    color: #25548c;
  }

  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .form-header p {
    margin: 0;
  }

  .success {
    color: green;
  }

  .error {
    class: red;
  }

  form {
    margin-top: 20px;
  }

  .form-wrapper input {
    height: 30px;
    width: 100%;
  }

  .name, #email {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .name div {
    width: 45%
  }

  .name div input {
    width: 100%
  }

  .form-wrapper textarea {
    height: 10rem;
    width: 100%;
  }

  .form-wrapper button {
    background-color: #25548c;
    color: #ffffff;
    height: 40px;
    width: 125px;
    margin-top: 15px;
  }

  @media screen and (min-width: 768px) {
    .contact {
      max-width: 700px;
    }
  }

  @media screen and (max-width: 767px) {
    .contact p {
      padding: 0 20px;
    }
    .form-wrapper {
      width: 90%;
    }

    .form input {
      height: 40px;
    }
  }
</style>