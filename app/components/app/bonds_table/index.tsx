function BondsTable() {
  return (
    <div className="flex items-start justify-center w-full">
      <div className="w-full">
        <table className="table-auto w-full">
          <thead>
            <tr className="text-sable-green-secondary-text uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">{"ASSET #ID"}</th>
              <th className="py-3 px-6 text-left">ISSUE DATE</th>
              <th className="py-3 px-6 text-center">MATURITY</th>
              <th className="py-3 px-6 text-center">APY</th>
              <th className="py-3 px-6 text-center">{"TICKET SIZE (N)"}</th>
              <th className="py-3 px-6 text-center">{"PRICE ($)"}</th>
              <th className="py-3 px-6 text-center">REMAINING BONDS</th>
            </tr>
          </thead>
          <tbody className="text-white-600 text-sm font-light">
            <tr className="bg-[#101919] hover:bg-gray-600">
              <td className="py-3 px-6 text-left">
                <div className="flex items-center">
                  <span className="font-small">dark protocol</span>
                </div>
              </td>
              <td className="py-3 px-6 text-left">
                <div className="flex items-center text-green-500">
                  <span>{"XX/YY/ZZZZ"}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-center">
                <div className="flex items-center text-red-500">
                  <span>{"AA/BB/CCCC"}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-center">
                <div className="flex items-center">
                  <span>{"12.69%"}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-center">
                <div className="flex items-center">
                  <span>{"50,000$ DARK"}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-center">
                <div className="flex items-center">
                  <span>{"$1,000"}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-center">
                <div className="flex items-center">
                  <span>X556</span>
                </div>
              </td>
            </tr>
            <tr className="bg-sable-green-secondary-text hover:bg-gray-600">
              <td className="py-3 px-6 text-left">
                <div className="flex items-center">
                  <span className="font-small">{"example nft's"}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-left">
                <div className="flex items-center text-green-500">
                  <span>{"XX/YY/ZZZZ"}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-center">
                <div className="flex items-center text-red-500">
                  <span>{"AA/BB/CCCC"}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-center">
                <div className="flex items-center">
                  <span>X 04</span>
                </div>
              </td>
              <td className="py-3 px-6 text-center">
                <div className="flex items-center">
                  <span>{"5 NFT'S"}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-center">
                <div className="flex items-center">
                  <span>{"$400"}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-center">
                <div className="flex items-center">
                  <span>35</span>
                </div>
              </td>
            </tr>
            <tr className="bg-[#101919] hover:bg-gray-600">
              <td className="py-3 px-6 text-left">
                <div className="flex items-center">
                  <span className="font-small">dark protocol</span>
                </div>
              </td>
              <td className="py-3 px-6 text-left">
                <div className="flex items-center text-green-500">
                  <span>{"XX/YY/ZZZZ"}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-center">
                <div className="flex items-center text-red-500">
                  <span>{"AA/BB/CCCC"}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-center">
                <div className="flex items-center">
                  <span>{"12.69%"}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-center">
                <div className="flex items-center">
                  <span>{"50,000$ DARK"}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-center">
                <div className="flex items-center">
                  <span>{"$1,000"}</span>
                </div>
              </td>
              <td className="py-3 px-6 text-center">
                <div className="flex items-center">
                  <span>X556</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="flex justify-center py-5">
          <a
            href=""
            className="flex py-2 items-center w-1/4 justify-center bg-gradient-to-r from-[#141d1d] via-[#283a3a] to-from-[#141d1d] text-[#4c6e6e]"
          >
            View All Bonds
          </a>
        </div>
      </div>
    </div>
  );
}

export default BondsTable;
