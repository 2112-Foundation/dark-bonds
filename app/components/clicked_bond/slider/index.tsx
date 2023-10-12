import React, { useState } from "react";
import "./slider.css";

function Slider() {
  const [sliderValue, setSliderValue] = useState(0);

  const handleSlide = (event: any) => {
    setSliderValue(event.target.valueAsNumber);
  };

  const handleRelease = () => {
    if (sliderValue !== 100) {
      setSliderValue(0); // Reset to minimum value if not slid to maximum
    }
  };

  return (
    <div className="w-full h-40 flex relative text-center">
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        className="w-full rounded-md appearance-none transition-colors absolute"
        value={sliderValue}
        onInput={handleSlide}
        onMouseUp={handleRelease}
      />
      <div className="flex mx-10 absolute w-1/2 justify-center items-center h-full text-sable-green-text">
        Slide to Confirm Bond Agreement
      </div>
    </div>
  );
}

export default Slider;
