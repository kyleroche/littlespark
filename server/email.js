export async function sendServiceEmail({to,subject,text,idempotencyKey}) {
  if (!process.env.RESEND_API_KEY) throw Error('Service email is not configured.');
  const response=await fetch('https://api.resend.com/emails',{
    method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json',...(idempotencyKey?{'Idempotency-Key':idempotencyKey}:{})},
    body:JSON.stringify({from:process.env.AUTH_FROM_EMAIL||'Little Spark <login@auth.littlespark.tech>',to:[to],subject,text})
  });
  if(!response.ok)throw Error('Service email could not be sent.');
}
