export async function registerUserReq(body) {
  const reqParams = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  };
  try {
    const res = await fetch('/auth/register', reqParams).then((response) => {
      if (response.ok) return response;
      throw response;
    });

    return { redirect: res.url };
  } catch (err) {
    const errorObject = JSON.parse(await err.text());
    return { error: errorObject };
  }
}

export async function signInUserReq(body) {
  const reqParams = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  };

  try {
    const res = await fetch('/auth/signin', reqParams).then((response) => {
      if (response.ok) return response;
      throw response;
    });

    return { redirect: res.url };
  } catch (err) {
    const errorObject = JSON.parse(await err.text());
    return { error: errorObject };
  }
}

export async function signInCheckReq() {
  const reqParams = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    return await fetch('/auth/signInCheck', reqParams).then((response) => {
      if (response.ok) {
        return response;
      }
      throw response;
    });
  } catch (err) {
    console.error(JSON.parse(await err.text()));
  }
}

export async function emailVerificationCheckReq(token) {
  const reqParams = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    return await fetch(
      `/auth/emailVerificationCheck?token=${token}`,
      reqParams
    ).then((response) => {
      if (response.ok) {
        return response;
      }
      throw response;
    });
  } catch (err) {
    console.error(JSON.parse(await err.text()));
  }
}

export async function emailVerificationReq(token, verificationCode) {
  const body = { Token: token, VerificationCode: verificationCode };

  const reqParams = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  };

  try {
    return await fetch(`/auth/verify-email`, reqParams).then((response) => {
      if (response.ok) {
        return response;
      }
      throw response;
    });
  } catch (err) {
    return err;
  }
}
