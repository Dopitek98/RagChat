
function UserInput({
  handleTextChange,
}: {
  handleTextChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      className="min-h-12 w-full bg-transparent px-4 py-3 text-sm text-ink outline-none placeholder:text-slate-400"
      type="text"
      onChange={handleTextChange}
      placeholder="Message your QA agent..."
      aria-label="Message your QA agent"
    />
  );
}

export default UserInput;
