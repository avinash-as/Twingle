const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-dark-100 dark:bg-dark-800 flex items-center justify-center">
        <Icon className="w-10 h-10 text-dark-400" />
      </div>
      <h3 className="text-lg font-medium text-dark-900 dark:text-dark-100 mb-2">{title}</h3>
      <p className="text-dark-500 dark:text-dark-400 mb-6 max-w-xs">{description}</p>
      {action}
    </div>
  );
};

export default EmptyState;