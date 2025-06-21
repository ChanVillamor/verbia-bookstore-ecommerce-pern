const Title = ({ text1, text2, className, text1Class, text2Class }) => {
  return (
    <div className={`inline-flex gap-2 items-center mb-3 ${className || ""}`}>
      <p className={`text-base md:text-lg ${text1Class || ""}`}>
        {text1}{" "}
        <span className={`${text2Class || "font-medium"}`}>{text2}</span>
      </p>
    </div>
  );
};

export default Title;
