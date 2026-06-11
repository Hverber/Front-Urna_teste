export default function DigitBoxes({ total, digits }) {
  return (
    <div className="digit-boxes">
      {Array.from({ length: total }).map((_, index) => (
        <div key={index} className="digit-box">
          {digits[index] || ''}
        </div>
      ))}
    </div>
  )
}
