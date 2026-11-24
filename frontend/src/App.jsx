import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    contact: '',
  })
  const [status, setStatus] = useState({ type: 'idle', message: '' })
  const [isPaying, setIsPaying] = useState(false)

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

  const handleChange = (event) => {
    const { name, value } = event.target
    setCustomer((current) => ({ ...current, [name]: value }))
  }

  const handlePayment = async (event) => {
    event.preventDefault()

    if (!customer.name.trim() || !customer.email.trim() || !customer.contact.trim()) {
      setStatus({ type: 'error', message: 'Please complete all student details.' })
      return
    }

    setIsPaying(true)
    setStatus({ type: 'idle', message: '' })

    try {
      const { data: keyData } = await axios.get(`${apiBaseUrl}/api/payment/get-key`)
      const { data: order } = await axios.post(
        `${apiBaseUrl}/api/payment/create-order`,
        { amount: 50 },
      )

      if (!window.Razorpay) {
        throw new Error('Razorpay checkout could not be loaded.')
      }

      const options = {
        key: keyData.key,
        amount: order.amount,
        currency: order.currency,
        name: 'Raj',
        description: 'Backend Course Enrollment',
        order_id: order.id,
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.contact,
        },
        theme: {
          color: '#7357ff',
        },
        handler: async (response) => {
          try {
            await axios.post(`${apiBaseUrl}/api/payment/verify`, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            })
            setStatus({
              type: 'success',
              message: 'Payment successful! Your seat is confirmed.',
            })
          } catch (error) {
            setStatus({
              type: 'error',
              message: error.response?.data?.message || 'Payment verification failed.',
            })
          } finally {
            setIsPaying(false)
          }
        },
        modal: {
          ondismiss: () => setIsPaying(false),
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.on('payment.failed', (response) => {
        setStatus({
          type: 'error',
          message: response.error?.description || 'Payment was not completed.',
        })
        setIsPaying(false)
      })
      razorpay.open()
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Unable to start payment.',
      })
      setIsPaying(false)
    }
  }

  return (
    <main className="checkout-page">
      <header className="brand">
        <div className="brand-mark">R </div>
        <span>Raj</span>
      </header>

      <section className="checkout-card" aria-label="Course checkout">
        <div className="course-panel">
          <div className="course-icon" aria-hidden="true">
            <span>&lt;/&gt;</span>
          </div>
          <p className="eyebrow">Backend Development</p>
          <h1>Build production-ready APIs</h1>
          <p className="course-description">
            Learn Node.js, Express, databases, authentication, and real-world deployment.
          </p>
          <ul className="course-details">
            <li><span className="check">✓</span> Lifetime course access</li>
            <li><span className="check">✓</span> Practical projects</li>
            <li><span className="check">✓</span> Certificate of completion</li>
          </ul>
        </div>

        <form className="payment-panel" onSubmit={handlePayment}>
          <p className="eyebrow">Secure checkout</p>
          <h2>Complete your enrollment</h2>

          <label>
            Full name
            <input
              name="name"
              value={customer.name}
              onChange={handleChange}
              placeholder="Alex Morgan"
              autoComplete="name"
            />
          </label>

          <label>
            Email address
            <input
              name="email"
              type="email"
              value={customer.email}
              onChange={handleChange}
              placeholder="alex@example.com"
              autoComplete="email"
            />
          </label>

          <label>
            Phone number
            <input
              name="contact"
              type="tel"
              value={customer.contact}
              onChange={handleChange}
              placeholder="9999999999"
              autoComplete="tel"
            />
          </label>

          <div className="price-row">
            <div>
              <span>Course fee</span>
              <small>One-time payment</small>
            </div>
            <strong>₹50</strong>
          </div>

          {status.message && (
            <div className={`status ${status.type}`} role="status">
              {status.message}
            </div>
          )}

          <button type="submit" disabled={isPaying}>
            {isPaying ? 'Opening secure checkout...' : 'Pay ₹50 securely'}
          </button>
          <p className="secure-note">
            <span aria-hidden="true">▣</span> Payments processed securely by Razorpay
          </p>
        </form>
      </section>
    </main>
  )
}

export default App
