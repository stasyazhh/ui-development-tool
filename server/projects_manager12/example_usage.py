from projects_manager import ProjectsManager

DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'ui_projects_db',
    'user': 'postgres',
    'password': 'password'
}


def main():
    with ProjectsManager(DB_CONFIG) as manager:
        
        print("=== Создание проектов ===")
        project1 = manager.create_project("Интерфейс админ-панели")
        print(f"Создан: {project1}")
        
        project2 = manager.create_project("Мобильное приложение")
        print(f"Создан: {project2}")
        
        project3 = manager.create_project("Лендинг для стартапа")
        print(f"Создан: {project3}")
        
        print("\n=== Список всех проектов ===")
        projects = manager.get_all_projects()
        for p in projects:
            print(f"  {p.id}: {p.name} (создан: {p.created_at})")
        
        print("\n=== Получение проекта по ID ===")
        project = manager.get_project_by_id(project1.id)
        if project:
            print(f"Найден: {project}")
            print(f"  В виде словаря: {project.to_dict()}")
        
        print("\n=== Изменение проекта ===")
        updated = manager.update_project(project2.id, "Мобильное приложение v2.0")
        if updated:
            print(f"Обновлён: {updated}")
        
        print("\n=== Удаление проекта ===")
        deleted = manager.delete_project(project3.id)
        print(f"Проект удалён: {deleted}")
        
        print("\n=== Финальный список проектов ===")
        projects = manager.get_all_projects()
        for p in projects:
            print(f"  {p.id}: {p.name}")
        
        print("\n=== Попытка удалить несуществующий проект ===")
        deleted = manager.delete_project(9999)
        print(f"Проект удалён: {deleted}")
        
        print("\n=== Обработка ошибок ===")
        try:
            manager.create_project("")
        except ValueError as e:
            print(f"Ошибка: {e}")


if __name__ == "__main__":
    main()
