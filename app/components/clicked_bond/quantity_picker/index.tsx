import { AiFillPlusSquare, AiFillMinusSquare } from "react-icons/ai";

interface ChildProps {
  updateTokenNumber: (to: number) => void;
  numberTokens: number;
}

function QuantityPicker({ updateTokenNumber, numberTokens }: ChildProps) {
  const handleMinusButtonClick = () => {
    if (numberTokens > 0) updateTokenNumber(numberTokens - 1);
  };

  const handlePlusButtonClick = () => {
    updateTokenNumber(numberTokens + 1);
  };

  return (
    <div className="flex w-full xl:h-16 justify-between items-center">
      <AiFillMinusSquare
        className="text-red-400"
        size={50}
        onClick={handleMinusButtonClick}
      />
      <div className="flex">
        Purchase
        <div className="underline">{numberTokens}</div>
        <div className="text-gray-500">$TOKEN</div>
        Bonds?
      </div>
      <AiFillPlusSquare
        className="text-green-400"
        size={50}
        onClick={handlePlusButtonClick}
      />
    </div>
  );
}
export default QuantityPicker;
