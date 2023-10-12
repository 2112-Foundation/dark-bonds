import React from "react";
import { FaNewspaper } from "react-icons/fa";
import { BsFillBagFill } from "react-icons/bs";
import { HiOutlineBanknotes } from "react-icons/hi2";
import { showBond } from "../../redux/features/displayBondSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, useAppSelector } from "../../redux/store";

interface BondItemProps {
  bond: {
    id: number;
    name: string;
    supply: string;
    bondtype: string;
    issuedate: string;
    expirydate: string;
    apy: string;
  };
}

const BondItem: React.FC<BondItemProps> = ({ bond }) => {
  const dispatch = useDispatch<AppDispatch>();
  const isDisplayed = useAppSelector((state) => state.displayBondReducer.value);

  const displayBond = () => {
    dispatch(showBond(bond.id.toString()));
    // else dispatch(showBond(false));
  };
  return (
    <div onClick={displayBond} className="h-full group p-4 lg:p-4">
      <div className="flex items-center gap-x-2 ">
        <div className="bg-sable-green-text aspect-[2/2] w-16 border-[1px] border-sable-green-text rounded-md" />
        <div>
          <div className="flex">
            <h3 className="text-xl text-gray-50">{bond.name}</h3>
            <div className="flex items-center mx-4 text-l text-sable-green-secondary-text">
              $TOKEN
            </div>
          </div>
          <div className="text-xs text-gray-300">{bond.supply} SUPPLY</div>
          <a
            href=""
            className="text-xs text-sable-green-secondary-text underline "
          >
            view on solscan
          </a>
        </div>
      </div>
      <form className="flex my-4">
        <div className="px-1 w-2/7">
          <label
            htmlFor="bondtype"
            className="block mb-2 text-xs text-white-100"
          >
            bondtype
          </label>
          <input
            readOnly
            type="text"
            id="bondtype"
            value={bond.bondtype}
            className="p-2 bg-sable-green-page-bg border border-sable-green-secondary-text text-white-900 text-xs rounded-lg block w-full"
            required
          />
        </div>
        <div className="px-1 w-2/7">
          <label
            htmlFor="issue_date"
            className="block mb-2 text-xs text-white-100"
          >
            issue date
          </label>
          <input
            readOnly
            type="text"
            id="issue_date"
            value={bond.issuedate}
            className="p-2 bg-sable-green-page-bg border border-sable-green-secondary-text text-white-900 text-xs rounded-lg block w-full"
            required
          />
        </div>
        <div className="px-1 w-2/7">
          <label
            htmlFor="expiry_date"
            className="block mb-2 text-xs text-white-100"
          >
            expiry date
          </label>
          <input
            readOnly
            type="text"
            id="expiry_date"
            className="p-2 bg-sable-green-page-bg border border-sable-green-secondary-text text-white-900 text-xs rounded-lg block w-full"
            value={bond.expirydate}
            required
          />
        </div>
        <div className="px-1 w-1/7">
          <label htmlFor="apy" className="block mb-2 text-xs text-white-100">
            apy
          </label>
          <input
            readOnly
            type="text"
            id="apy"
            className="p-2 bg-sable-green-page-bg border border-sable-green-secondary-text text-white-900 text-xs rounded-lg block w-full"
            value={bond.apy}
            required
          />
        </div>
      </form>
      <div className="flex justify-between text-xs p-2.5">
        <span className=" flex m-1 ml-0 inline-block text-white-500 items-center text-[0.7rem]">
          <div className="flex items-center text-bond-item-icon-txt bg-bond-item-icon-bg p-1 rounded-sm">
            <BsFillBagFill />
          </div>
          <div className="flex px-1">
            +50,000 <div className="text-bond-item-icon-bg px-1">$TOKEN</div>{" "}
            per Bond
          </div>
        </span>
        <span className="flex m-1 ml-0 inline-block text-white-500 items-center text-[0.7rem]">
          <div className="flex items-center text-bond-item-icon-txt bg-bond-item-icon-bg p-1 rounded-sm">
            <HiOutlineBanknotes />
          </div>
          <div className="flex px-1">
            -1.25 <div className="text-bond-item-icon-bg px-1">$SOL</div> per
            Bond
          </div>
        </span>
      </div>
      <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#101919]">
        <span className="text-[0.75rem] text-gray-50">
          250,000 $TOKEN Supply Remaining
        </span>
        <a className="font-medium text-sable-green-secondary-text transition-all duration-300 group-hover:text-sable-green-placeholder">
          <FaNewspaper />
        </a>
      </div>
    </div>
  );
};
export default BondItem;
