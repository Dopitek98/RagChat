import "./UserInput.css";
function UserInput({
  handleTextChange,
}: {
  handleTextChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <input
        className="input-box"
        type="text"
        onChange={handleTextChange}
        placeholder="Enter question to llm"
      />
    </div>
  );
}

export default UserInput;
