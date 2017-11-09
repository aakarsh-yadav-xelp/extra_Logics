import { default as jobSchema } from "schemas/job.schema.js";
import { default as JobApplicationSchema } from "schemas/jobApplication.schema.js";
import BaseModel from "db/BaseModel.js";
import IndustryModel from "db/IndustryModel.js";
import JobFunctionModel from "db/JobFunctionModel.js";
import SkillModel from "db/SkillModel.js";
import RoleModel from "db/RoleModel.js";
import _ from "lodash";
var async = require("async");

export default class JobModel extends BaseModel {
  constructor(connection) {
    super("Job", connection);
    this.name = "Job";
    this.schema = jobSchema;
    this.JobApplicationName = "jobapplications";
    this.JobApplicationSchema = JobApplicationSchema;
    this.connection = connection;
    this.model = this.connection.model(this.name, this.schema);
    this.industryModel = new IndustryModel(this.connection);
    this.roleModel = new RoleModel(this.connection);
    this.skillModel = new SkillModel(this.connection);
    this.jobFunctionModel = new JobFunctionModel(this.connection);
    this.jobApplicationModel = this.connection.model(
      this.JobApplicationName,
      JobApplicationSchema
    );
  }
  async create(jobData) {
    // create the job
    // get all users
    // run scoring algorithm and create matches.
    if (!this.model) {
      await this._getModel();
    }
    try {
      let createdJob = new this.model(jobData);
      await createdJob.save();
      if (createdJob) {
        return createdJob;
      } else {
        throw new Error("[500] error in create new job");
      }
    } catch (e) {
      throw e;
    }
  }

  async update(jobId, jobData) {
    // I need to update matches.
    // get all matches for that job.
    // get all candidates
    // run the scoring algorithm
    // for each candidate, update the match
    if (!this.model) {
      await this._getModel();
    }
    if (!jobId) {
      throw new Error("Cannot update Job without jobId");
    }
    try {
      const updatedJob = await this.model.findOneAndUpdate(
        { _id: jobId },
        { $set: jobData },
        { new: true, runValidators: false }
      );
      if (updatedJob) {
        return updatedJob;
      } else {
        throw new Error("[500] error in update job");
      }
    } catch (e) {
      throw e;
    }
  }
  async getJobs(populate: false) {
    if (!this.model) {
      await this._getModel();
    }
    try {
      if (populate) {
        return await this.model
          .find({})
          .populate({
            path: "industry",
            model: "Industry"
          })
          .populate({
            path: "function",
            model: "JobFunction"
          })
          .populate({
            path: "skills",
            model: "Skill"
          })
          .populate({
            path: "roles",
            model: "Role"
          });
      } else {
        return await this.model.find({});
      }
    } catch (e) {
      throw e;
    }
  }
  //   async getJobsForUserId(userId, lean) {
  //     let jobIds = [];
  //     if (!this.model) {
  //       await this._getModel();
  //     }
  //     try {
  //       if (lean) {
  //         let allJobs = await this.model.find({ userId: userId }).lean();
  //         _.forEach(allJobs, function(value) {
  //           jobIds.push(value._id);
  //         });
  //         console.log(allJobs);
  //         let jobApplicationStatus = await this.jobApplicationModel
  //           .find({}, { jobApplicationStatus: 1, jobId: 1, _id: 0 })
  //           .where("jobId")
  //           .in(jobIds)
  //           .lean();
  //         console.log(jobApplicationStatus);
  //       } else {
  //         return await this.model.find({ userId: userId });
  //       }
  //     } catch (e) {
  //       throw e;
  //     }
  //   }
  // }
  //Aakarsh yadav
  async getJobsForUserI(userId) {
    let jobIds = [];
    var jobQueries = [];
    var jobQueriesObject = {};
    var jobQueriesStatus = {};
    var finalJobList = [];
    if (!this.model) {
      await this._getModel();
    }

    var getAllJobDetailByUserId = async userId => {
      var users = await this.model
        .find({ userId: userId })
        .then(function(users) {
          return users;
        })
        .catch(function(error) {
          throw new Error(error);
        });
      users.forEach(async u => {
        jobQueries.push(this.jobApplicationModel.find({ jobId: u._id }));
      });
      return await Promise.all(jobQueries);
    };
    let jobApplicationData = await getAllJobDetailByUserId(userId);
    async.each(jobApplicationData, async job => {
      jobQueriesStatus[job[0].jobId] = { rejected: 0, applied: 0 };
      job.forEach(o => {
        if (o.jobApplicationStatus == "rejected") {
          jobQueriesStatus[o.jobId]["rejected"] =
            jobQueriesStatus[o.jobId]["rejected"] + 1;
        }
        if (o.jobApplicationStatus == "applied") {
          jobQueriesStatus[o.jobId]["applied"] =
            jobQueriesStatus[o.jobId]["applied"] + 1;
        }
      });
    });

    async.each(Object.keys(jobQueriesStatus), async jobId => {
      let finalJobListTemp = {};
      let data = await this.model.find({ _id: jobId });
      finalJobListTemp["jobDetail"] = await data;
      finalJobListTemp["applied"] = jobQueriesStatus[jobId]["applied"];
      finalJobListTemp["rejected"] = jobQueriesStatus[jobId]["rejected"];
      await finalJobList.push(finalJobListTemp);
      console.log(data, finalJobList);
    });

    // var getAllJobWithStatus = await GetAllJobWithStatusNode(jobQueriesStatus);
    // console.log(jobQueriesStatus, finalJobList);
    return finalJobList;
    // this.model.find({ userId: userId })
    // .populate(this.JobApplicationName)  // populates comments objects based on ids in `comments`
    // .exec()
    // .then(function(commentsAndPosts) {
    //   console.log(commentsAndPosts);
    //   // return res.json(commentsAndPosts);
    // })
    // .catch(function(err) {
    //   console.log(err);
    //   return res.json(err);
    // });
    // let main23 = Promise.each(
    // jobApplicationData.forEach( (u)=>{
    //   jobQueriesObject[u.jobId] =  u;
    // }));
    // var mdasd = await Promise.resolve(jobApplicationData)
    // .then(each((val) => jobQueriesObject[val.jobId]=val); return jobQueriesObject);

    // var main = async userId => {
    //   let dataTo = [];
    //   var jobData = await fetchJob(userId);
    //   await jobData.forEach( async (element) => {
    //     let tempData = await this.jobApplicationModel.find({ jobId: element._id });
    //     returnData.push(tempData);
    //     i=i+1;
    //     console.log(i);
    //     if(i==2){
    //       // console.log("asdas"+returnData);
    //       return returnData;
    //     }
    //   });
    //   var mainadsd = await dataJobApplication(jobData);
    //   console.log(mainadsd);
    // };

    // var fetchJob = async userId => {
    //   return await this.model
    //     .find({ userId: userId })
    //     .find({})
    //     .then((jobs) => {
    //       return jobs;
    //     });
    // };
    // var dataJobApplication = async (dataJobs,cb) => {
    //   var returnData = [];
    //   // for(let element in dataJobs){
    //   //   let jobApplicationStatus = await this.jobApplicationModel.find({ jobId: element._id });
    //   //   await returnData.push(jobApplicationStatus);
    //   // }
    //   let i = 0;

    //   return await dataJobs.forEach( async (element) => {
    //     let tempData = await this.jobApplicationModel.find({ jobId: element._id });
    //     returnData.push(tempData);
    //     i=i+1;
    //     console.log(i);
    //     if(i==2){
    //       // console.log("asdas"+returnData);
    //       return returnData;
    //     }
    //   });
    // };
    // // main(userId);
  }
  async getJobsForUserId(userId, lean) {
    let jobIds = [];
    let finalJobs = [];
    let jobQueriesStatus = {};
    let applied, Rejected;
    if (!this.model) {
      await this._getModel();
    }
    try {
      if (lean) {
        let jobs = await this.model.find({ userId: userId }).lean();
        _.forEach(jobs, function(job) {
          jobIds.push(job._id);
        });

        let jobApplications = await this.jobApplicationModel
          .find({}, { jobApplicationStatus: 1, jobId: 1, _id: 0 })
          .where("jobId")
          .in(jobIds)
          .lean();

        let jobApplicationStatusMapWithJobId = _(jobApplications)
          .groupBy("jobId")
          .mapValues(_.partial(_.map, _, "jobApplicationStatus"))
          .toPairs()
          .map(_.partial(_.zipObjectDeep, ["jobId", "jobApplicationStatus"]))
          .value();

        await _.forEach(jobs, function(job) {
          job["jobApplicationStatus"] = {
            rejected: 0,
            applied: 0
          };
          _.forEach(jobApplicationStatusMapWithJobId, function(jobApplication) {
            if (job._id === jobApplication.jobId) {
              _.forEach(jobApplication.jobApplicationStatus, function(status) {
                if (status === "applied") {
                  job.jobApplicationStatus.applied++;
                }
                if (status === "rejected") {
                  job.jobApplicationStatus.rejected++;
                }
              });
            }
          });
          finalJobs.push(job);
        });
        return await finalJobs;
      }
    } catch (e) {
      throw e;
    }
  }
}
