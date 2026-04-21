// Auto-generated from tiku/数据库_第二次技术考试.md
(function() {
  registerBank({
    id: 'database-tech-exam-2',
    name: '数据库题库',
    description: '110 单选 + 45 判断 + 4 SQL 填空，来源：数据库题库.docx',
    icon: '🗄️',
    group: '技术考试',
    source: 'builtin',
    mdContent: normalizeDatabaseMarkdown(extractRawMarkdown(function() {/*
# 数据库题库

> 共提取 110 道单选 + 45 道判断 + 4 道 SQL 填空，来源：数据库题库.docx

---

## 单选题

> 共 110 道单选题

---

### 1. 在E-R模型中，用来表示实体集的图形是？

- A. 椭圆
- B. 菱形
- C. 矩形
- D. 圆圈

**答案：** C

---

### 2. 在E-R模型中，用来表示属性的图形是？

- A. 矩形
- B. 菱形
- C. 椭圆
- D. 线段

**答案：** C

---

### 3. 在E-R模型中，用来表示联系集的图形是？

- A. 矩形
- B. 菱形
- C. 椭圆
- D. 线段

**答案：** B

---

### 4. 一个学生可以选修多门课程，一门课程也可以被多个学生选修，这种联系是？

- A. 一对一 (1:1)
- B. 一对多 (1:N)
- C. 多对一 (N:1)
- D. 多对多 (M:N)

**答案：** D

---

### 5. 一个班级只有一个班主任，一个班主任只负责一个班级，这种联系是？

- A. 一对一 (1:1)
- B. 一对多 (1:N)
- C. 多对一 (N:1)
- D. 多对多 (M:N)

**答案：** A

---

### 6. 一个部门有多个员工，但一个员工只属于一个部门，这种联系是？

- A. 一对一 (1:1)
- B. 一对多 (1:N)
- C. 多对一 (N:1)
- D. 多对多 (M:N)

**答案：** B

---

### 7. 在“学生-选课-课程”的E-R模型中，“选课”通常是？

- A. 实体
- B. 属性
- C. 联系
- D. 弱实体

**答案：** C

---

### 8. 将E-R图转换为关系模式时，一个多对多（M:N）的联系通常会转换成？

- A. 一个单独的关系表
- B. 合并到任意一方的实体表中
- C. 在双方实体表中都增加外键
- D. 忽略该联系

**答案：** A

---

### 9. 将E-R图转换为关系模式时，一个一对多（1:N）的联系，外键应建立在？

- A. “一”方的实体表中
- B. “多”方的实体表中
- C. 单独建立一个新表
- D. 双方实体表中都建立

**答案：** B

---

### 10. 在E-R图中，如果联系集也具有属性，这些属性应如何处理？

- A. 删除这些属性
- B. 将其添加到参与联系的任一实体集中
- C. 在转换为关系模式时，将其作为联系对应关系表的属性
- D. 忽略这些属性

**答案：** C

---

### 11. 下列哪项不是E-R模型的三要素？

- A. 实体
- B. 属性
- C. 联系
- D. 元组

**答案：** D

---

### 12. “职工”和“部门”之间的“工作于”联系，如果规定一个职工必须属于一个部门，而一个部门可以没有职工，那么“工作于”联系的基数比是？

- A. 1:1
- B. 1:N
- C. N:1
- D. M:N

**答案：** C

---

### 13. “顾客”和“订单”之间的联系通常是？

- A. 1:1
- B. 1:N
- C. N:1
- D. M:N

**答案：** B

---

### 14. 复合属性是指？

- A. 由多个简单属性组成的属性
- B. 可以取空值的属性
- C. 作为主键的属性
- D. 作为外键的属性

**答案：** A

---

### 15. 多值属性是指？

- A. 只能取一个值的属性
- B. 可以同时取多个值的属性
- C. 值不能为空的属性
- D. 值必须唯一的属性

**答案：** B

---

### 16. 在设计E-R图时，对于“地址”属性，如果需要分别记录省、市、区、街道，则“地址”最好设计为？

- A. 简单属性
- B. 复合属性
- C. 多值属性
- D. 派生属性

**答案：** B

---

### 17. 派生属性是指？

- A. 可以从其他属性计算得到的属性
- B. 存储在数据库中的基本属性
- C. 作为主键的属性
- D. 作为外键的属性

**答案：** A

---

### 18. 在“学生”实体中，“年龄”可以根据“出生日期”计算得出，那么“年龄”是一个？

- A. 简单属性
- B. 复合属性
- C. 多值属性
- D. 派生属性

**答案：** D

---

### 19. E-R模型主要用于数据库设计的哪个阶段？

- A. 需求分析
- B. 概念结构设计
- C. 逻辑结构设计
- D. 物理结构设计

**答案：** B

---

### 20. 在E-R图中，连接实体集和属性的线段代表？

- A. 联系
- B. 继承
- C. 拥有或描述
- D. 关联

**答案：** C

---

### 21. 关系数据库规范化的主要目的是？

- A. 提高查询速度
- B. 减少数据冗余和操作异常
- C. 增加数据存储量
- D. 简化数据库物理结构

**答案：** B

---

### 22. 第一范式（1NF）要求关系中的每个属性值都是？

- A. 唯一的
- B. 不为空的
- C. 原子的（不可再分）
- D. 数值型的

**答案：** C

---

### 23. 下列哪个表满足第一范式（1NF）？

- A. 学生(学号, 姓名, 电话号码) 其中电话号码可能包含多个号码用逗号分隔
- B. 学生(学号, 姓名, 家庭住址) 其中家庭住址包含省、市、区等信息
- C. 学生(学号, 姓名, 手机)
- D. 学生(学号, 姓名, 选修课程) 其中选修课程是一个列表

**答案：** C

---

### 24. 第二范式（2NF）是在满足1NF的基础上，要求所有非主属性？

- A. 都完全函数依赖于候选码
- B. 都部分函数依赖于候选码
- C. 不存在传递函数依赖
- D. 都是非空的

**答案：** A

---

### 25. 第三范式（3NF）是在满足2NF的基础上，要求所有非主属性？

- A. 都完全函数依赖于候选码
- B. 都直接函数依赖于候选码，不存在传递函数依赖
- C. 都是原子的
- D. 都不能为NULL

**答案：** B

---

### 26. 一个好的关系模式应该？

- A. 尽可能减少表的数量
- B. 追求最高的范式级别，即使影响性能
- C. 在数据冗余、操作异常和查询效率之间取得平衡
- D. 将所有信息放在一个大表中

**答案：** C

---

### 27. 下列哪种异常不是由于未规范化引起的？

- A. 插入异常
- B. 删除异常
- C. 更新异常
- D. 查询异常

**答案：** D

---

### 28. 插入异常是指？

- A. 无法删除不需要的数据
- B. 修改一个数据需要修改多处
- C. 无法插入某些有用的信息，因为缺少其他信息
- D. 查询结果不一致

**答案：** C

---

### 29. 更新异常是指？

- A. 无法插入新记录
- B. 删除一条记录会丢失其他信息
- C. 修改一个数据值需要修改多个地方，否则导致不一致
- D. 查询速度慢

**答案：** C

---

### 30. 删除异常是指？

- A. 无法执行DELETE语句
- B. 删除一条记录的同时，意外地删除了其他不相关的有用信息
- C. 删除操作很慢
- D. 删除后数据无法恢复

**答案：** B

---

### 31. 下列关于范式化的说法，正确的是？

- A. 范式化程度越高越好
- B. 范式化一定能提高所有查询的性能
- C. 过度范式化可能导致查询时需要频繁连接，影响性能
- D. 反范式化总是有害的

**答案：** C

---

### 32. 在MySQL中，用于创建数据库的SQL语句是？

- A. NEW DATABASE
- B. CREATE DATABASE
- C. ADD DATABASE
- D. MAKE DATABASE

**答案：** B

---

### 33. 在MySQL中，用于选择要操作的数据库的命令是？

- A. USE
- B. SELECT
- C. OPEN
- D. DATABASE

**答案：** A

---

### 34. 在MySQL中，用于创建数据表的SQL语句是？

- A. NEW TABLE
- B. CREATE TABLE
- C. ADD TABLE
- D. MAKE TABLE

**答案：** B

---

### 35. 在CREATE TABLE语句中，用于定义主键的约束关键字是？

- A. UNIQUE
- B. PRIMARY KEY
- C. FOREIGN KEY
- D. CHECK

**答案：** B

---

### 36. 在CREATE TABLE语句中，用于定义外键的约束关键字是？

- A. UNIQUE
- B. PRIMARY KEY
- C. FOREIGN KEY
- D. REFERENCES

**答案：** C

---

### 37. 在MySQL中，用于向表中插入数据的SQL语句是？

- A. INSERT INTO
- B. ADD INTO
- C. UPDATE INTO
- D. PUT INTO

**答案：** A

---

### 38. 正确的INSERT语句语法是？

- A. INSERT INTO 表名 VALUE (值1, 值2);
- B. INSERT 表名 VALUES (值1, 值2);
- C. INSERT INTO 表名 VALUES (值1, 值2);
- D. INSERT VALUES (值1, 值2) INTO 表名;

**答案：** C

---

### 39. 在MySQL中，用于修改表中已有数据的SQL语句是？

- A. ALTER
- B. UPDATE
- C. MODIFY
- D. CHANGE

**答案：** B

---

### 40. 正确的UPDATE语句语法是？

- A. UPDATE 表名 SET 列=值 WHERE 条件;
- B. UPDATE SET 列=值 FROM 表名 WHERE 条件;
- C. MODIFY 表名 SET 列=值 WHERE 条件;
- D. ALTER 表名 SET 列=值 WHERE 条件;

**答案：** A

---

### 41. 在MySQL中，用于删除表中数据的SQL语句是？

- A. REMOVE
- B. DELETE
- C. DROP
- D. TRUNCATE

**答案：** B

---

### 42. DELETE FROM 表名; 这条语句的作用是？

- A. 删除表的结构
- B. 删除表中的所有数据，但保留表结构
- C. 删除数据库
- D. 删除表的第一个数据

**答案：** B

---

### 43. TRUNCATE TABLE 表名; 这条语句的作用是？

- A. 删除表的结构
- B. 删除表中的所有数据，但保留表结构，通常比DELETE更快
- C. 只删除表的一部分数据
- D. 禁用表

**答案：** B

---

### 44. DROP TABLE 表名; 这条语句的作用是？

- A. 只删除表中的数据
- B. 删除表的结构和其中的所有数据
- C. 清空表数据并重置自增ID
- D. 重命名表

**答案：** B

---

### 45. 在SELECT语句中，用于指定查询哪些列的关键字是？

- A. FROM
- B. WHERE
- C. SELECT
- D. ORDER BY

**答案：** C

---

### 46. 在SELECT语句中，用于指定从哪个表查询数据的关键字是？

- A. SELECT
- B. FROM
- C. WHERE
- D. GROUP BY

**答案：** B

---

### 47. 在SELECT语句中，用于筛选行记录的关键字是？

- A. SELECT
- B. FROM
- C. WHERE
- D. HAVING

**答案：** C

---

### 48. 下列哪个WHERE子句可以查找name字段值为'张三'的记录？

- A. WHERE name = '张三'
- B. WHERE name == '张三'
- C. WHERE name is '张三'
- D. WHERE '张三' = name

**答案：** A

---

### 49. 在MySQL中，字符串比较默认是？

- A. 区分大小写
- B. 不区分大小写
- C. 视数据类型而定
- D. 总是区分大小写

**答案：** B

---

### 50. SELECT * FROM student WHERE age BETWEEN 18 AND 22; 这条语句查找的是？

- A. age大于18且小于22的学生
- B. age大于等于18且小于等于22的学生
- C. age等于18或22的学生
- D. age不在18到22之间的学生

**答案：** B

---

### 51. SELECT * FROM student WHERE name LIKE '李%'; 这条语句查找的是？

- A. 名字包含'李'字的学生
- B. 姓氏为'李'的学生
- C. 名字以'李'结尾的学生
- D. 名字只有两个字且第一个是'李'的学生

**答案：** B

---

### 52. 在LIKE模式中，'%'代表？

- A. 一个任意字符
- B. 零个或多个任意字符
- C. 一个数字字符
- D. 一个字母字符

**答案：** B

---

### 53. 在LIKE模式中，'_'代表？

- A. 零个或多个任意字符
- B. 一个任意字符
- C. 一个空格字符
- D. 一个下划线字符

**答案：** B

---

### 54. SELECT * FROM student WHERE city IN ('北京', '上海', '广州'); 这条语句等价于？

- A. WHERE city = '北京' AND city = '上海' AND city = '广州'
- B. WHERE city = '北京' OR city = '上海' OR city = '广州'
- C. WHERE city LIKE '北京' OR '上海' OR '广州'
- D. WHERE city CONTAINS ('北京', '上海', '广州')

**答案：** B

---

### 55. SELECT * FROM student WHERE age IS NULL; 这条语句查找的是？

- A. age字段值为0的学生
- B. age字段值为空字符串''的学生
- C. age字段值为NULL的学生
- D. age字段不存在的学生

**答案：** C

---

### 56. 在MySQL中，对查询结果进行排序的关键字是？

- A. SORT
- B. ORDER BY
- C. GROUP BY
- D. ARRANGE

**答案：** B

---

### 57. SELECT * FROM student ORDER BY age DESC; 这条语句按age字段？

- A. 升序排列
- B. 降序排列
- C. 随机排列
- D. 不排列

**答案：** B

---

### 58. 在SELECT语句中，用于对数据进行分组的关键字是？

- A. ORDER BY
- B. GROUP BY
- C. SORT BY
- D. FILTER BY

**答案：** B

---

### 59. 在使用GROUP BY时，如果要对分组后的结果进行筛选，应使用？

- A. WHERE
- B. HAVING
- C. FILTER
- D. AFTER GROUP

**答案：** B

---

### 60. 下列聚合函数中，用于计算总和的是？

- A. COUNT()
- B. SUM()
- C. AVG()
- D. MAX()

**答案：** B

---

### 61. SELECT COUNT(*) FROM student; 这条语句的作用是？

- A. 计算student表中所有列的数量
- B. 计算student表中所有行的数量
- C. 计算student表中非NULL的name字段数量
- D. 计算student表的大小

**答案：** B

---

### 62. JDBC的全称是？

- A. Java Database Connection
- B. Java Data Base Connectivity
- C. Java Database Connectivity
- D. Java Data Base Connection

**答案：** C

---

### 63. JDBC是Java语言中用于？

- A. 图形用户界面开发
- B. 网络通信
- C. 数据库访问和管理的标准API
- D. 文件读写

**答案：** C

---

### 64. 使用JDBC连接数据库的第一步通常是？

- A. 创建Statement对象
- B. 加载并注册数据库驱动
- C. 获取Connection对象
- D. 执行SQL语句

**答案：** B

---

### 65. 加载MySQL JDBC驱动的代码通常是？

- A. Class.forName("com.mysql.jdbc.Driver");
- B. DriverManager.loadDriver("com.mysql.cj.jdbc.Driver");
- C. new com.mysql.cj.jdbc.Driver();
- D. System.loadLibrary("mysql-connector-java");

**答案：** A

---

### 66. 用于建立与数据库连接的接口是？

- A. Statement
- B. PreparedStatement
- C. Connection
- D. ResultSet

**答案：** C

---

### 67. 获取数据库连接通常使用哪个类的静态方法？

- A. Connection
- B. DriverManager
- C. Statement
- D. ResultSet

**答案：** B

---

### 68. 下列哪个URL格式是连接本地MySQL数据库db_name的正确示例？

- A. jdbc:mysql://localhost:3306/db_name
- B. mysql://localhost:3306/db_name
- C. jdbc:mysql:localhost:3306/db_name
- D. http://localhost:3306/db_name

**答案：** A

---

### 69. 用于执行SQL查询语句并返回结果集的对象是？

- A. Connection
- B. Statement 或 PreparedStatement
- C. ResultSet
- D. DriverManager

**答案：** B

---

### 70. 执行SELECT查询语句，应使用Statement对象的哪个方法？

- A. executeUpdate()
- B. executeQuery()
- C. execute()
- D. query()

**答案：** B

---

### 71. 执行INSERT, UPDATE, DELETE语句，应使用Statement对象的哪个方法？

- A. executeQuery()
- B. executeUpdate()
- C. execute()
- D. modify()

**答案：** B

---

### 72. 用于存储和遍历SQL查询结果的对象是？

- A. Connection
- B. Statement
- C. ResultSet
- D. PreparedStatement

**答案：** C

---

### 73. 要从ResultSet中获取当前行第一列的整数值，应使用？

- A. rs.getInt(1);
- B. rs.getInteger(1);
- C. rs.getString(1);
- D. rs.getValue(1);

**答案：** A

---

### 74. 要从ResultSet中获取当前行名为"name"的列的字符串值，应使用？

- A. rs.getString("name");
- B. rs.getString(name);
- C. rs.getValue("name");
- D. rs.get("name");

**答案：** A

---

### 75. 在遍历ResultSet时，通常使用哪个方法将指针移动到下一行？

- A. next()
- B. moveNext()
- C. forward()
- D. go()

**答案：** A

---

### 76. PreparedStatement相比于Statement的主要优势是？

- A. 执行速度总是更快
- B. 可以执行DDL语句
- C. 能有效防止SQL注入攻击，并且在多次执行相似SQL时效率更高
- D. 可以返回多个结果集

**答案：** C

---

### 77. PreparedStatement中的占位符用什么符号表示？

- A. ?
- B. @
- C. %
- D. $

**答案：** A

---

### 78. 为PreparedStatement的第n个占位符设置字符串参数，应使用？

- A. ps.setString(n, value);
- B. ps.setParameter(n, value);
- C. ps.setValue(n, value);
- D. ps.set(n, value);

**答案：** A

---

### 79. JDBC编程中，资源释放的正确顺序是？

- A. Connection -> Statement -> ResultSet
- B. ResultSet -> Statement -> Connection
- C. Statement -> ResultSet -> Connection
- D. 任意顺序

**答案：** B

---

### 80. 在JDBC中，事务处理是通过哪个对象的方法来控制的？

- A. Statement
- B. ResultSet
- C. Connection
- D. DriverManager

**答案：** C

---

### 81. 在JDBC中，默认情况下，每条SQL语句都是一个独立的事务。要开启手动事务控制，应调用Connection的哪个方法？

- A. setAutoCommit(true);
- B. setAutoCommit(false);
- C. beginTransaction();
- D. startTransaction();

**答案：** B

---

### 82. 在手动事务控制模式下，提交事务应调用Connection的哪个方法？

- A. commit();
- B. submit();
- C. save();
- D. end();

**答案：** A

---

### 83. 在手动事务控制模式下，回滚事务应调用Connection的哪个方法？

- A. rollback();
- B. undo();
- C. revert();
- D. cancel();

**答案：** A

---

### 84. JDBC驱动程序属于？

- A. Java SE的一部分
- B. 由数据库厂商提供或第三方开发的JAR包
- C. 操作系统自带
- D. Web服务器组件

**答案：** B

---

### 85. 下列哪个不是JDBC的核心接口或类？

- A. Driver
- B. Connection
- C. Socket
- D. Statement

**答案：** C

---

### 86. 在try-catch块中使用JDBC，SQLException通常需要被捕获。这个异常属于？

- A. RuntimeException
- B. Error
- C. Checked Exception
- D. 自定义异常

**答案：** C

---

### 87. 使用JDBC连接数据库时，除了驱动JAR包，还需要知道？

- A. 数据库的IP地址、端口号、数据库名、用户名和密码
- B. 数据库服务器的品牌
- C. 数据库的物理位置
- D. 数据库管理员的姓名

**答案：** A

---

### 88. ResultSet.TYPE_FORWARD_ONLY 表示结果集是？

- A. 可滚动的，可向前向后移动
- B. 只能向前移动的
- C. 可更新的
- D. 只读的

**答案：** B

---

### 89. ResultSet.CONCUR_READ_ONLY 表示结果集是？

- A. 可以修改的
- B. 只能读取的
- C. 可滚动的
- D. 类型敏感的

**答案：** B

---

### 90. 在现代Java开发中，推荐使用什么方式来自动管理JDBC资源（如Connection, Statement, ResultSet）？

- A. System.gc()
- B. finalize()方法
- C. try-with-resources语句
- D. 手动在finally块中close()

**答案：** C

---

### 91. 以下关于数据库的描述，正确的是（ ）

- A. 数据库是一个文件系统
- B. 数据库是长期存储在计算机内、有组织的、可共享的数据集合
- C. 数据库只能存储文本数据
- D. 数据库不需要管理系统来维护，通过Navicat和JDBC连接和操作数据表的数据

**答案：** B

---

### 92. 以下不属于关系型数据库的是（ ）

- A. MySQL		   B. Oracle
- C. Redis			D. SQL Server

**答案：** C

---

### 93. 实体 - 联系图（ER 图）中，用（ ）表示实体

- A. 矩形				B. 椭圆形
- C. 菱形				D. 直线

**答案：** A

---

### 94. 以下哪种联系类型不属于实体之间的联系（ ）

- A. 一对一联系		B. 一对多联系
- C.多对多联系 		D. 多对零联系

**答案：** C

---

### 95. 第二范式（2NF）要求关系满足（），并且所有非主属性完全依赖于（ ）

- A. 第一范式（1NF）、外键
- B. 第三范式（3NF）、主键
- C. 第一范式（1NF）、主键
- D. 第三范式（3NF）、外键

**答案：** C

---

### 96. 一个关系模式满足第二范式（2NF），但不满足第三范式（3NF），可能存在的问题是（ ）

- A. 插入异常			B. 部分依赖
- C. 传递依赖			D. 以上都不对

**答案：** C

---

### 97. 下列语句可用于查看当前数据库服务器中的所有数据库的是（ ）

- A. SHOW  TABLES;
- B. SHOW  DATABASES;
- C. SELECT  DATABASES;
- D. VIEW  DATABASES;

**答案：** B

---

### 98. 若要从表 student中查询所有学生的姓名和年龄，正确的 SQL 语句是（ ）

- A. SELECT name, age FROM student;
- B. SELECT * FROM student WHERE name, age;
- C. SELECT name AND age FROM student;
- D. SELECT name, age IN student;

**答案：** A

---

### 99. 在 SQL 中，HAVING 子句通常与（ ）一起使用。

- A. ORDER BY
- B. GROUP BY
- C. DELETE
- D. WHERE

**答案：** B

---

### 100. 若要更新表 product中create_date 为2024年1月1日前的数据的price 字段的值为原来的1.2倍，正确的 SQL 语句是（ ）

- A. UPDATE WHERE create_date < '2024-01-01' product SET price = 1.2;
- B. UPDATE product WHERE price = price * 1.2 and create_date < '2024-01-01';
- C. UPDATE price = price * 1.2 FROM product WHERE create_date < '2024-01-01';
- D. UPDATE product SET price = price * 1.2 WHERE create_date < '2024-01-01';

**答案：** D

---

### 101. 在 SQL 中，（ ）函数能返回满足where条件的指定列的行的总数

- A. COUNT
- B. SUM
- C. TOTAL
- D. ALL

**答案：** A

---

### 102. 若要删除表 employee 中 salary 小于 2000 的记录，正确的 SQL 语句是（	）

- A. DELETE FROM employee WHERE salary < 2000;
- B. DROP FROM employee WHERE salary < 2000;
- C. REMOVE FROM employee WHERE salary < 2000;
- D. DELETE employee WHERE salary < 2000;

**答案：** A

---

### 103. 在 SQL 中，使用 ALTER TABLE 语句修改表结构时，若要删除表中的一个字段，	正确的语法是（ ）

- A. ALTER TABLE table_name DROP COLUMN column_name;
- B. ALTER TABLE table_name DELETE COLUMN column_name;
- C. ALTER TABLE table_name REMOVE COLUMN column_name;
- D. ALTER TABLE table_name DROP field_name;

**答案：** A

---

### 104. 查询出以“双体”开头的数据，以下正确的是（ ）

- A.LIKE '双体*'
- B. LIKE ' %双体'
- C.LIKE '双体? '
- D. LIKE '双体% '

**答案：** D

---

### 105. 以下关于 JDBC 的描述中，哪一项是正确的

- A. JDBC驱动必须通过 Class.forName() 显式加载才能建立数据库连接
- B. JDBC未通过一组API屏蔽底层数据库的差别，未使用统一方式访问数据库
- C. Statement 接口的 execute() 方法仅支持返回布尔值
- D. ResultSet 接口的 getString() 方法不仅仅只能读取 VARCHAR 类型的列

**答案：** D

---

### 106. 下列关于DriverManager在JDBC中作用，正确的是（ ）

- A. 执行 SQL 语句
- B. 处理查询结果集
- C. 加载数据库驱动和建立数据库连接
- D. 创建数据库表

**答案：** C

---

### 107. 在 JDBC中，ResultSet 对象的 next() 方法的作用是（ ）

- A. 将光标移动到结果集的第一行
- B. 将光标移动到结果集的下一行
- C. 将光标移动到结果集的最后一行
- D. 关闭结果集

**答案：** B

---

### 108. 以下关于主键和外键的说法，正确的是（ ）

- A. 一个表只能有一个主键和一个外键
- B. 主键可以为空，外键不可以为空
- C. 主键用于唯一标识表中的记录，外键用于建立表与表之间的关联
- D. 主键和外键都可以有重复值

**答案：** C

---

### 109. 在数据库设计中，反规范化设计通常是为了（ ）

- A. 提高数据的查询效率
- B. 减少数据冗余
- C. 提高数据的安全性
- D. 增加数据表的数量和数据量

**答案：** A

---

### 110. 在JDBC中，PreparedStatement类中的executeUpdate()方法返回值表示（ ）

- A. 执行的 SQL 语句类型
- B. 执行的 SQL 语句是否成功
- C. 查询结果集的行数
- D. 受影响的行数

**答案：** D

---

## 判断题

> 原标注 45 道，实际存在部分题目（Q15-Q24、Q31-Q36 原文档缺失）

---

### 1. 在E-R图中，实体集通常用矩形表示。

**答案：** 正确

---

### 2. 联系集的基数比（Cardinality）表示实体之间的数量关系，如1:1、1:N、M:N。

**答案：** 正确

---

### 3. E-R图中的多值属性可以直接作为表的一个字段存储。

**答案：** 错误（需单独建表处理）

---

### 4. 将E-R图转换为关系模式时，多对多联系直接合并到任意一方的实体表中。

**答案：** 错误（需单独建表）

---

### 5. 派生属性（如“年龄”）可以通过其他属性计算得出，无需存储。

**答案：** 正确

---

### 6. E-R图中的“复合属性”可以分解为多个简单属性。

**答案：** 正确

---

### 7. 在E-R图中，一个实体可以同时属于多个超类。

**答案：** 正确

---

### 8. 第一范式（1NF）要求所有属性值必须唯一。

**答案：** 错误（要求属性值原子化，而非唯一）

---

### 9. 第二范式（2NF）要求所有非主属性完全依赖于候选码。

**答案：** 正确

---

### 10. 如果一个关系模式满足3NF，则一定满足2NF。

**答案：** 正确

---

### 11. 规范化的主要目的是减少数据冗余和操作异常（如插入/删除异常）。

**答案：** 正确

---

### 12. 主键可以包含多个属性，但外键不能包含多个属性。

**答案：** 错误（外键也可以是复合键）

---

### 13. DELETE FROM table_name; 会删除表的结构和数据。

**答案：** 错误（仅删除数据，保留表结构）

---

### 14. TRUNCATE TABLE table_name; 比 DELETE FROM table_name; 执行更快，但无法回滚。

**答案：** 正确（TRUNCATE不记录日志，不可回滚）

---

### 15. SELECT * FROM table WHERE name LIKE '张%'; 会匹配姓“张”的所有记录。

**答案：** 正确

---

### 16. INSERT INTO table (col1, col2) VALUES (1, 'A'); 可以省略列名，直接写值。

**答案：** 正确（但顺序必须与表结构一致）

---

### 17. UPDATE table SET col1 = 'B' WHERE col2 = 'C'; 不加WHERE条件会更新全表。

**答案：** 正确

---

### 18. GROUP BY 子句必须与聚合函数（如COUNT、SUM）一起使用。

**答案：** 正确

---

### 19. HAVING 子句用于筛选分组后的结果，类似 WHERE。

**答案：** 正确

---

### 20. ORDER BY 可以对非SELECT列表的列进行排序。

**答案：** 正确

---

### 21. JOIN操作中，LEFT JOIN 会返回左表所有记录，即使右表无匹配。

**答案：** 正确

---

### 22. ALTER TABLE table_name ADD COLUMN new_col INT; 会立即修改表结构。

**答案：** 正确

---

### 23. PRIMARY KEY 和 UNIQUE 约束都可以为NULL值。

**答案：** 错误（主键不能为NULL，唯一键可允许一个NULL）

---

### 24. AUTO_INCREMENT 属性只能用于主键字段。

**答案：** 错误（可用于任意整型字段）

---

### 25. JDBC是Java语言中用于网络通信的标准API。

**答案：** 错误（JDBC用于数据库访问）

---

### 26. 加载MySQL驱动的代码是Class.forName("com.mysql.cj.jdbc.Driver");。

**答案：** 正确

---

### 27. Connection 对象用于执行SQL语句并返回结果集。

**答案：** 错误

---

### 28. （Statement或PreparedStatement用于执行SQL）PreparedStatement 可以防止SQL注入攻击。

**答案：** 正确

---

### 29. ResultSet对象的next()方法用于移动到下一行数据。

**答案：** 正确

---

### 30. try-with-resources 语句可以自动关闭 Connection、Statement 和 ResultSet。

**答案：** 正确

---

### 31. JDBC事务默认是自动提交模式（AutoCommit = true）。

**答案：** 正确

---

### 32. ROLLBACK 用于提交事务，COMMIT 用于回滚事务。

**答案：** 错误（顺序颠倒）

---

### 33. DriverManager.getConnection() 方法需要数据库URL、用户名和密码参数。

**答案：** 正确

---

### 34. PreparedStatement 的占位符 ? 可以通过 setString()、setInt() 等方法赋值。

**答案：** 正确

---

### 35. ResultSet 的列索引从1开始，而不是从0开始。

**答案：** 正确

---

### 36. 第一范式可以允许个别属性是可在分的，目的是便于提高查询的便捷性。

**答案：** 错误

---

### 37. 数据库管理系统（DBMS）是一种硬件设备，用于管理数据库。

**答案：** 错误

---

### 38. 数据库是按一定数据模型组织和存储的存放数据的仓库。

**答案：** 正确

---

### 39. DDL是Data Definition Language的简写，它是用来定义数据库的对象的语言，包括定义数据表、视图、索引。

**答案：** 正确

---

### 40. 在SQL语句中，DELETE 语句能删除表中的部分记录，也能删除表本身。

**答案：** 错误

---

### 41. 在MySQL中，VARCHAR类型字段的存储空间是固定的，而CHAR类型字段的存储空间是可变的。

**答案：** 错误

---

### 42. 类Connection表示与数据库的连接，一个 Connection 对象只能执行一条 SQL 语句。

**答案：** 错误

---

### 43. 多表查询时，如果不指定表之间的连接条件，则连接变成笛卡尔乘积操作，查询结果中存在大量无意义的数据。

**答案：** 正确

---

### 44. 在 JDBC 中，加载数据库驱动是建立数据库连接的必要步骤，且不同的数据库有不同的驱动类。

**答案：** 错误

---

### 45. 数据冗余会产生更新、插入、删除等异常，因此在数据库设计时，绝对不能有冗余数据。

**答案：** 错误

---

## SQL编程填空题

> 共 4 道填空题

---

### 题目一：学生选课信息查询与统计

假设有一个学生选课数据库，包含以下三个表：
- **Students (学生表)**: student_id (学号), name (姓名), age (年龄), major (专业)
- **Courses (课程表)**: course_id (课程编号), course_name (课程名称), credits (学分), department (开课院系)
- **Enrollments (选课记录表)**: enrollment_id (选课记录ID), student_id (学号), course_id (课程编号), grade (成绩), semester (学期)

**SQL代码：**

```sql
-- 1. 查询计算机系学生的姓名和年龄，按年龄升序排列。
SELECT ____1____, ____2____
FROM ____3____
WHERE ____4____ = 'Computer Science'
ORDER BY ____5____ ____6____;
-- 2. 查询每门课程的名称和平均成绩（保留2位小数），只显示平均成绩大于75分的课程。
SELECT c.____7____, ROUND(AVG(e.____8____), 2) AS avg_grade
FROM Courses c
JOIN ____9____ e ON c.course_id = e.course_id
GROUP BY c.course_id
HAVING AVG(e.grade) > 75
ORDER BY avg_grade ____10____;
```

**答案：**
1. name
2. age
3. Students
4. major
5. age
6. ASC
7. course_name
8. grade
9. Enrollments
10. DESC

---

### 题目二：销售订单数据统计与筛选

假设有一个销售数据库，包含以下两个表：
- **Products (产品表)**: product_id (产品ID), product_name (产品名称), category (产品类别), unit_price (单价)
- **Orders (订单表)**: order_id (订单ID), product_id (产品ID), quantity (数量), order_date (订单日期)

**SQL代码：**

```sql
-- 1. 查询“电子产品”类别的所有产品名称和单价。
SELECT ____1____, ____2____
FROM ____3____
WHERE ____4____ = 'Electronics';
-- 2. 查询2023年总销售额（单价 * 数量）最高的产品名称。
SELECT p.____5____
FROM ____6____ p
JOIN ____7____ o ON p.product_id = o.product_id
WHERE ____8____ LIKE '2023%'
GROUP BY p.product_id, p.product_name
ORDER BY SUM(p.____9____ * o.____10____) DESC
LIMIT 1;
```

**答案：**
1. product_name
2. unit_price
3. Products
4. category
5. product_name
6. Products
7. Orders
8. o.order_date
9. unit_price
10. quantity

---

### 题目三：员工薪资与部门信息查询

假设有一个公司的人力资源数据库，包含以下两个表：
- **Employees (员工表)**: emp_id (员工ID), emp_name (员工姓名), dept_id (部门ID), salary (月薪), hire_date (入职日期), position (职位)
- **Departments (部门表)**: dept_id (部门ID), dept_name (部门名称), manager_id (部门经理ID), location (办公地点)

**SQL代码：**

```sql
-- 1. 查询所有“技术部”员工的姓名、职位和月薪。
SELECT ____1____, ____2____, ____3____
FROM ____4____ e
JOIN ____5____ d ON e.dept_id = d.dept_id
WHERE d.____6____ = '技术部';
-- 2. 查询每个部门的名称、员工平均月薪（四舍五入到整数），并按平均月薪降序排列。
SELECT d.____7____, ROUND(AVG(e.____8____)) AS avg_salary
FROM Departments d
JOIN ____9____ e ON d.dept_id = e.dept_id
GROUP BY ____10____
ORDER BY avg_salary 
DESC;
```

**答案：**
1. e.emp_name
2. e.position
3. e.salary
4. Employees
5. Departments
6. dept_name
7. dept_name
8. salary
9. Employees
10. d.dept_id

---

### 题目四：乡村振兴农产品管理系统

农产品管理是乡村振兴中关键环节之一，为了更好地管理保存农户农产品，需要设计一个乡村振兴农产品管理系统。系统目前需要管理以下内容：
- **农户（peasant）信息**：包括农户编号（peasant_no）、农户姓名（peasant_name）、联系方式（peasant_tel）、所在村庄（village）
- **农产品（farm_product）信息**：包括农产品编号（farm_product_no）、农产品名称（farm_product_name）、类别（farm_product_type）、市场价（farm_product_price）
- **农户农产品（peasant_product）信息**：包括农户编号（peasant_no）、农产品编号（farm_product_no）

**子问题：**
① 补全以下部分建表语句
② 现需新增两条农户信息，补全以下语句
③ 查询所在村庄为"民主村"的农户姓名、其生产的农产品名称和市场价，并按照价格从大到小排序，补全以下语句

**①建表 SQL代码：**

```sql
____1____ table `farm_product` (   `___2____ ` bigint Primary Key 
COMMENT '农产品编号',   `farm_product_name` varchar(100)  
COMMENT '农产品名称',   `farm_product_type` varchar(20)    
COMMENT '类别',   `farm_product_price` DECIMAL(8,2)  
COMMENT '市场价' 
);
```

**①建表 答案：**
1. create
2. farm_product_no

**②插入 SQL代码：**

```sql
____3____  into `peasant` (`peasant_no`,`peasant_name`,`peasant_tel`,`village`)  ____4____(1001,'张三','13122223333','富强村'),(1002,'李四','18066668888','民主村'
);
```

**②插入 答案：**
1. insert
2. values

**③查询 SQL代码：**

```sql
SELECT p.____5____,   fp.farm_product_name, fp.farm_product_price 
FROM `farm_product` fp ____6____  join `peasant_product` pp ON fp.`farm_product_no` = pp.`____7____` inner  join `peasant` p 
ON  p.`peasant_no` = pp.`peasant_no`
WHERE p.`village` ____8____ ____9____ fp.farm_product_price____10____ ;
```

**③查询 答案：**
1. peasant_name
2. inner
3. farm_product_no
4. ="民主村"
5. order by
6. desc

---
*/}))
  });

  function extractRawMarkdown(fn) {
    var source = fn.toString();
    return source.slice(source.indexOf('/*') + 2, source.lastIndexOf('*/')).replace(/^\n/, '');
  }

  function normalizeDatabaseMarkdown(md) {
    var questions = QuizDB.parseBankQuestions(md);
    var lines = [
      '# 数据库题库',
      '',
      '> 共提取 110 道单选 + 45 道判断 + 4 道 SQL 填空，来源：数据库题库.docx',
      ''
    ];

    for (var i = 0; i < questions.length; i++) {
      if (i > 0) {
        lines.push('');
        lines.push('---');
        lines.push('');
      }
      appendQuestion(lines, questions[i]);
    }

    return lines.join('\n');
  }

  function appendQuestion(lines, question) {
    var textLines = String(question.text || '').split('\n');
    var title = textLines.shift() || '';
    var bodyLines = trimBlankLines(textLines);

    lines.push('## ' + question.id + '. ' + title);

    if (bodyLines.length) {
      lines.push('');
      lines.push(bodyLines.join('\n'));
    }

    if (question.options && question.options.length) {
      lines.push('');
      for (var i = 0; i < question.options.length; i++) {
        var option = question.options[i];
        lines.push('- ' + option.label + '. ' + option.text);
      }
    }

    appendSection(lines, '答案', question.answer);
    appendSection(lines, '解析', question.explanation);
  }

  function appendSection(lines, label, content) {
    var value = String(content || '');
    if (!value) return;

    lines.push('');
    if (value.indexOf('\n') === -1) {
      lines.push('**' + label + '：** ' + value);
      return;
    }

    lines.push('**' + label + '：**');
    lines.push(value);
  }

  function trimBlankLines(lines) {
    var copy = lines.slice();
    while (copy.length && !copy[0].trim()) copy.shift();
    while (copy.length && !copy[copy.length - 1].trim()) copy.pop();
    return copy;
  }
})();
